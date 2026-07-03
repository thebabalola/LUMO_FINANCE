package services

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vatilize-labs/lumo-finance/internal/models"
)

type UserService struct {
	dbPool *pgxpool.Pool
}

type UpdateProfileInput struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

func NewUserService(dbPool *pgxpool.Pool) *UserService {
	return &UserService{dbPool: dbPool}
}

func (service *UserService) GetProfile(ctx context.Context, userID string) (*models.UserProfile, error) {
	var profile models.UserProfile
	err := service.dbPool.QueryRow(ctx,
		`SELECT id, email, COALESCE(name, ''), COALESCE(phone, ''), status, created_at
		 FROM users WHERE id = $1`,
		userID,
	).Scan(&profile.ID, &profile.Email, &profile.Name, &profile.Phone, &profile.Status, &profile.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (service *UserService) UpdateProfile(ctx context.Context, userID string, input UpdateProfileInput) (*models.UserProfile, error) {
	_, err := service.dbPool.Exec(ctx,
		`UPDATE users
		 SET name = COALESCE(NULLIF($1, ''), name),
		     phone = COALESCE(NULLIF($2, ''), phone),
		     updated_at = NOW()
		 WHERE id = $3`,
		input.Name, input.Phone, userID)
	if err != nil {
		return nil, err
	}
	return service.GetProfile(ctx, userID)
}
