package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenIssuer struct {
	secret         []byte
	accessTokenTTL time.Duration
}

type AccessTokenClaims struct {
	UserID  string
	TokenID string
}

func NewTokenIssuer(secret string, accessTokenTTL time.Duration) *TokenIssuer {
	return &TokenIssuer{secret: []byte(secret), accessTokenTTL: accessTokenTTL}
}

func (issuer *TokenIssuer) IssueAccessToken(userID string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub": userID,
		"jti": uuid.NewString(),
		"iat": now.Unix(),
		"exp": now.Add(issuer.accessTokenTTL).Unix(),
		"typ": "access",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(issuer.secret)
}

func (issuer *TokenIssuer) AccessTokenTTL() time.Duration {
	return issuer.accessTokenTTL
}

func (issuer *TokenIssuer) VerifyAccessToken(tokenString string) (*AccessTokenClaims, error) {
	parsedToken, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return issuer.secret, nil
	}, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
	if err != nil {
		return nil, err
	}

	mapClaims, ok := parsedToken.Claims.(jwt.MapClaims)
	if !ok || !parsedToken.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	if tokenType, _ := mapClaims["typ"].(string); tokenType != "access" {
		return nil, fmt.Errorf("token is not an access token")
	}

	userID, _ := mapClaims["sub"].(string)
	if userID == "" {
		return nil, fmt.Errorf("token missing subject claim")
	}
	tokenID, _ := mapClaims["jti"].(string)

	return &AccessTokenClaims{UserID: userID, TokenID: tokenID}, nil
}
