package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/auth"
	"github.com/vatilize-labs/lumo-finance/internal/models"
	"github.com/vatilize-labs/lumo-finance/internal/otp"
)

const otpPurposeRegister = "register"

var (
	ErrEmailAlreadyRegistered = fmt.Errorf("an account with this email already exists")
	ErrInvalidCredentials     = fmt.Errorf("invalid email or password")
	ErrAccountNotVerified     = fmt.Errorf("account is not verified — complete OTP verification first")
	ErrAccountNotActive       = fmt.Errorf("account is not active")
	ErrUserNotFound           = fmt.Errorf("user not found")
)

type AuthService struct {
	dbPool            *pgxpool.Pool
	tokenIssuer       *auth.TokenIssuer
	refreshTokenStore *auth.RefreshTokenStore
	otpService        *otp.OneTimePasswordService
	auditRecorder     *audit.Recorder
}

type RegisterInput struct {
	Email    string `json:"email" validate:"required,email"`
	Phone    string `json:"phone" validate:"required"`
	Name     string `json:"name" validate:"required"`
	Password string `json:"password" validate:"required,min=8"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

func NewAuthService(
	dbPool *pgxpool.Pool,
	tokenIssuer *auth.TokenIssuer,
	refreshTokenStore *auth.RefreshTokenStore,
	otpService *otp.OneTimePasswordService,
	auditRecorder *audit.Recorder,
) *AuthService {
	return &AuthService{
		dbPool:            dbPool,
		tokenIssuer:       tokenIssuer,
		refreshTokenStore: refreshTokenStore,
		otpService:        otpService,
		auditRecorder:     auditRecorder,
	}
}

func (service *AuthService) Register(ctx context.Context, input RegisterInput, requestInfo audit.RequestInfo) (string, error) {
	passwordHash, err := auth.HashPassword(input.Password)
	if err != nil {
		return "", err
	}

	var userID string
	err = service.dbPool.QueryRow(ctx,
		`INSERT INTO users (email, name, phone, password_hash, status)
		 VALUES ($1, $2, $3, $4, 'pending_verification')
		 RETURNING id`,
		input.Email, input.Name, input.Phone, passwordHash,
	).Scan(&userID)
	if err != nil {
		var pgError *pgconn.PgError
		if errors.As(err, &pgError) && pgError.Code == "23505" {
			return "", ErrEmailAlreadyRegistered
		}
		return "", err
	}

	if err := service.otpService.GenerateAndSend(ctx, otpPurposeRegister, userID, input.Email); err != nil {
		return "", fmt.Errorf("failed to send verification code: %w", err)
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:       userID,
		EventType:    "user.registered",
		ResourceType: "user",
		ResourceID:   userID,
		IPAddress:    requestInfo.IPAddress,
		UserAgent:    requestInfo.UserAgent,
	})
	return userID, nil
}

// VerifyOTP activates the account, creates the user's wallet, and signs
// the user in by issuing their first token pair.
func (service *AuthService) VerifyOTP(ctx context.Context, email string, code string, requestInfo audit.RequestInfo) (*TokenPair, error) {
	user, err := service.findUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if err := service.otpService.Verify(ctx, otpPurposeRegister, user.ID, code); err != nil {
		return nil, err
	}

	_, err = service.dbPool.Exec(ctx,
		`UPDATE users SET status = 'active', verified_at = NOW(), updated_at = NOW() WHERE id = $1`,
		user.ID)
	if err != nil {
		return nil, err
	}

	_, err = service.dbPool.Exec(ctx,
		`INSERT INTO wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
		user.ID)
	if err != nil {
		return nil, err
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:       user.ID,
		EventType:    "auth.otp_verified",
		ResourceType: "user",
		ResourceID:   user.ID,
		IPAddress:    requestInfo.IPAddress,
		UserAgent:    requestInfo.UserAgent,
	})
	return service.issueTokenPair(ctx, user.ID)
}

func (service *AuthService) Login(ctx context.Context, email string, password string, requestInfo audit.RequestInfo) (*TokenPair, *models.UserProfile, error) {
	user, err := service.findUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			service.auditRecorder.Record(ctx, audit.Event{
				EventType: "auth.login_failed",
				IPAddress: requestInfo.IPAddress,
				UserAgent: requestInfo.UserAgent,
				Metadata:  map[string]interface{}{"email": email, "reason": "unknown_email"},
			})
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	if !auth.ComparePassword(user.PasswordHash, password) {
		service.auditRecorder.Record(ctx, audit.Event{
			UserID:    user.ID,
			EventType: "auth.login_failed",
			IPAddress: requestInfo.IPAddress,
			UserAgent: requestInfo.UserAgent,
			Metadata:  map[string]interface{}{"reason": "wrong_password"},
		})
		return nil, nil, ErrInvalidCredentials
	}
	if user.Status == "pending_verification" {
		return nil, nil, ErrAccountNotVerified
	}
	if user.Status != "active" {
		return nil, nil, ErrAccountNotActive
	}

	tokenPair, err := service.issueTokenPair(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:    user.ID,
		EventType: "auth.login_success",
		IPAddress: requestInfo.IPAddress,
		UserAgent: requestInfo.UserAgent,
	})
	return tokenPair, user.ToProfile(), nil
}

// Refresh rotates the presented refresh token. Presenting an already-rotated
// token is treated as theft: every session for that user is revoked.
func (service *AuthService) Refresh(ctx context.Context, refreshToken string, requestInfo audit.RequestInfo) (*TokenPair, error) {
	userID, newRefreshToken, err := service.refreshTokenStore.Rotate(ctx, refreshToken)
	if err != nil {
		return nil, err
	}

	accessToken, err := service.tokenIssuer.IssueAccessToken(userID)
	if err != nil {
		return nil, err
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:    userID,
		EventType: "auth.token_refreshed",
		IPAddress: requestInfo.IPAddress,
		UserAgent: requestInfo.UserAgent,
	})
	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(service.tokenIssuer.AccessTokenTTL().Seconds()),
	}, nil
}

func (service *AuthService) Logout(ctx context.Context, refreshToken string, requestInfo audit.RequestInfo) error {
	userID, err := service.refreshTokenStore.Revoke(ctx, refreshToken)
	if errors.Is(err, auth.ErrRefreshTokenNotFound) {
		return nil // already logged out — treat as success
	}
	if err != nil {
		return err
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:    userID,
		EventType: "auth.logout",
		IPAddress: requestInfo.IPAddress,
		UserAgent: requestInfo.UserAgent,
	})
	return nil
}

func (service *AuthService) RevokeAllSessions(ctx context.Context, userID string) error {
	return service.refreshTokenStore.RevokeAllForUser(ctx, userID)
}

func (service *AuthService) SetTransactionPin(ctx context.Context, userID string, pin string, requestInfo audit.RequestInfo) error {
	pinHash, err := auth.HashTransactionPin(pin)
	if err != nil {
		return err
	}
	commandTag, err := service.dbPool.Exec(ctx,
		`UPDATE users SET transaction_pin_hash = $1, updated_at = NOW() WHERE id = $2`,
		pinHash, userID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID:    userID,
		EventType: "auth.pin_set",
		IPAddress: requestInfo.IPAddress,
		UserAgent: requestInfo.UserAgent,
	})
	return nil
}

func (service *AuthService) GetTransactionPinHash(ctx context.Context, userID string) (string, error) {
	var pinHash *string
	err := service.dbPool.QueryRow(ctx,
		`SELECT transaction_pin_hash FROM users WHERE id = $1`, userID).Scan(&pinHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrUserNotFound
	}
	if err != nil {
		return "", err
	}
	if pinHash == nil {
		return "", fmt.Errorf("transaction PIN has not been set")
	}
	return *pinHash, nil
}

func (service *AuthService) issueTokenPair(ctx context.Context, userID string) (*TokenPair, error) {
	accessToken, err := service.tokenIssuer.IssueAccessToken(userID)
	if err != nil {
		return nil, err
	}
	refreshToken, err := service.refreshTokenStore.Issue(ctx, userID)
	if err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(service.tokenIssuer.AccessTokenTTL().Seconds()),
	}, nil
}

func (service *AuthService) findUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := service.dbPool.QueryRow(ctx,
		`SELECT id, email, COALESCE(name, ''), COALESCE(phone, ''), password_hash, status, verified_at, created_at, updated_at
		 FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.Name, &user.Phone, &user.PasswordHash,
		&user.Status, &user.VerifiedAt, &user.CreatedAt, &user.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}
