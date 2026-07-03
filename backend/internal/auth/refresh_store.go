package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// RefreshTokenStore keeps opaque refresh tokens in Redis so they can be
// rotated on every use and revoked instantly (no cleanup jobs needed —
// TTL handles expiry).
type RefreshTokenStore struct {
	redisClient     *redis.Client
	refreshTokenTTL time.Duration
}

type refreshTokenRecord struct {
	UserID   string    `json:"user_id"`
	IssuedAt time.Time `json:"issued_at"`
}

var ErrRefreshTokenNotFound = fmt.Errorf("refresh token not found or expired")

func NewRefreshTokenStore(redisClient *redis.Client, refreshTokenTTL time.Duration) *RefreshTokenStore {
	return &RefreshTokenStore{redisClient: redisClient, refreshTokenTTL: refreshTokenTTL}
}

func refreshTokenKey(tokenID string) string {
	return "auth:refresh_token:" + tokenID
}

func userRefreshTokensKey(userID string) string {
	return "auth:user_refresh_tokens:" + userID
}

func (store *RefreshTokenStore) Issue(ctx context.Context, userID string) (string, error) {
	tokenID := uuid.NewString()
	recordJSON, err := json.Marshal(refreshTokenRecord{UserID: userID, IssuedAt: time.Now()})
	if err != nil {
		return "", err
	}

	pipeline := store.redisClient.TxPipeline()
	pipeline.Set(ctx, refreshTokenKey(tokenID), recordJSON, store.refreshTokenTTL)
	pipeline.SAdd(ctx, userRefreshTokensKey(userID), tokenID)
	pipeline.Expire(ctx, userRefreshTokensKey(userID), store.refreshTokenTTL)
	if _, err := pipeline.Exec(ctx); err != nil {
		return "", err
	}
	return tokenID, nil
}

// Rotate consumes the given refresh token and issues a replacement.
// Returns the owning user ID and the new token.
func (store *RefreshTokenStore) Rotate(ctx context.Context, tokenID string) (string, string, error) {
	recordJSON, err := store.redisClient.GetDel(ctx, refreshTokenKey(tokenID)).Result()
	if err == redis.Nil {
		return "", "", ErrRefreshTokenNotFound
	}
	if err != nil {
		return "", "", err
	}

	var record refreshTokenRecord
	if err := json.Unmarshal([]byte(recordJSON), &record); err != nil {
		return "", "", err
	}
	store.redisClient.SRem(ctx, userRefreshTokensKey(record.UserID), tokenID)

	newTokenID, err := store.Issue(ctx, record.UserID)
	if err != nil {
		return "", "", err
	}
	return record.UserID, newTokenID, nil
}

func (store *RefreshTokenStore) Revoke(ctx context.Context, tokenID string) (string, error) {
	recordJSON, err := store.redisClient.GetDel(ctx, refreshTokenKey(tokenID)).Result()
	if err == redis.Nil {
		return "", ErrRefreshTokenNotFound
	}
	if err != nil {
		return "", err
	}
	var record refreshTokenRecord
	if err := json.Unmarshal([]byte(recordJSON), &record); err != nil {
		return "", err
	}
	store.redisClient.SRem(ctx, userRefreshTokensKey(record.UserID), tokenID)
	return record.UserID, nil
}

// RevokeAllForUser is the response to refresh-token reuse: if a rotated
// token is presented again, every session for that user is terminated.
func (store *RefreshTokenStore) RevokeAllForUser(ctx context.Context, userID string) error {
	tokenIDs, err := store.redisClient.SMembers(ctx, userRefreshTokensKey(userID)).Result()
	if err != nil {
		return err
	}
	pipeline := store.redisClient.TxPipeline()
	for _, tokenID := range tokenIDs {
		pipeline.Del(ctx, refreshTokenKey(tokenID))
	}
	pipeline.Del(ctx, userRefreshTokensKey(userID))
	_, err = pipeline.Exec(ctx)
	return err
}
