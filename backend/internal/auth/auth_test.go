package auth

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func TestAccessTokenRoundTrip(t *testing.T) {
	tokenIssuer := NewTokenIssuer("test-secret", 15*time.Minute)

	tokenString, err := tokenIssuer.IssueAccessToken("user-123")
	if err != nil {
		t.Fatalf("IssueAccessToken failed: %v", err)
	}

	claims, err := tokenIssuer.VerifyAccessToken(tokenString)
	if err != nil {
		t.Fatalf("VerifyAccessToken failed: %v", err)
	}
	if claims.UserID != "user-123" {
		t.Errorf("expected user ID user-123, got %s", claims.UserID)
	}
	if claims.TokenID == "" {
		t.Error("expected a non-empty token ID (jti)")
	}
}

func TestAccessTokenRejectsWrongSecret(t *testing.T) {
	tokenString, err := NewTokenIssuer("secret-one", 15*time.Minute).IssueAccessToken("user-123")
	if err != nil {
		t.Fatalf("IssueAccessToken failed: %v", err)
	}
	if _, err := NewTokenIssuer("secret-two", 15*time.Minute).VerifyAccessToken(tokenString); err == nil {
		t.Error("expected verification with a different secret to fail")
	}
}

func TestAccessTokenRejectsExpired(t *testing.T) {
	tokenIssuer := NewTokenIssuer("test-secret", -1*time.Minute)
	tokenString, err := tokenIssuer.IssueAccessToken("user-123")
	if err != nil {
		t.Fatalf("IssueAccessToken failed: %v", err)
	}
	if _, err := tokenIssuer.VerifyAccessToken(tokenString); err == nil {
		t.Error("expected expired token to be rejected")
	}
}

func TestPasswordHashing(t *testing.T) {
	passwordHash, err := HashPassword("S3curePass!")
	if err != nil {
		t.Fatalf("HashPassword failed: %v", err)
	}
	if !ComparePassword(passwordHash, "S3curePass!") {
		t.Error("expected correct password to match")
	}
	if ComparePassword(passwordHash, "WrongPass!") {
		t.Error("expected wrong password to be rejected")
	}
}

func TestTransactionPinValidation(t *testing.T) {
	invalidPins := []string{"123", "1234567", "12a4", ""}
	for _, invalidPin := range invalidPins {
		if err := ValidateTransactionPinFormat(invalidPin); err == nil {
			t.Errorf("expected PIN %q to be rejected", invalidPin)
		}
	}

	pinHash, err := HashTransactionPin("1234")
	if err != nil {
		t.Fatalf("HashTransactionPin failed: %v", err)
	}
	if !CompareTransactionPin(pinHash, "1234") {
		t.Error("expected correct PIN to match")
	}
	if CompareTransactionPin(pinHash, "4321") {
		t.Error("expected wrong PIN to be rejected")
	}
}

func newTestRedis(t *testing.T) *redis.Client {
	t.Helper()
	miniRedisServer := miniredis.RunT(t)
	return redis.NewClient(&redis.Options{Addr: miniRedisServer.Addr()})
}

func TestRefreshTokenRotation(t *testing.T) {
	ctx := context.Background()
	store := NewRefreshTokenStore(newTestRedis(t), time.Hour)

	originalToken, err := store.Issue(ctx, "user-123")
	if err != nil {
		t.Fatalf("Issue failed: %v", err)
	}

	userID, rotatedToken, err := store.Rotate(ctx, originalToken)
	if err != nil {
		t.Fatalf("Rotate failed: %v", err)
	}
	if userID != "user-123" {
		t.Errorf("expected user-123, got %s", userID)
	}
	if rotatedToken == originalToken {
		t.Error("expected rotation to produce a new token")
	}

	// Reusing the consumed token must fail — this signals token theft.
	if _, _, err := store.Rotate(ctx, originalToken); err != ErrRefreshTokenNotFound {
		t.Errorf("expected ErrRefreshTokenNotFound on reuse, got %v", err)
	}
}

func TestRevokeAllForUser(t *testing.T) {
	ctx := context.Background()
	store := NewRefreshTokenStore(newTestRedis(t), time.Hour)

	firstToken, _ := store.Issue(ctx, "user-123")
	secondToken, _ := store.Issue(ctx, "user-123")

	if err := store.RevokeAllForUser(ctx, "user-123"); err != nil {
		t.Fatalf("RevokeAllForUser failed: %v", err)
	}

	for _, revokedToken := range []string{firstToken, secondToken} {
		if _, _, err := store.Rotate(ctx, revokedToken); err != ErrRefreshTokenNotFound {
			t.Errorf("expected revoked token to be unusable, got %v", err)
		}
	}
}
