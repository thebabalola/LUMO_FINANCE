package otp

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

// capturingSender records the last code so tests can verify it.
type capturingSender struct {
	lastDestination string
	lastCode        string
}

func (sender *capturingSender) SendOneTimePassword(ctx context.Context, destination string, code string) error {
	sender.lastDestination = destination
	sender.lastCode = code
	return nil
}

func newTestService(t *testing.T) (*OneTimePasswordService, *capturingSender) {
	t.Helper()
	miniRedisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{Addr: miniRedisServer.Addr()})
	sender := &capturingSender{}
	return NewOneTimePasswordService(redisClient, sender, 10*time.Minute), sender
}

func TestGenerateAndVerify(t *testing.T) {
	ctx := context.Background()
	service, sender := newTestService(t)

	if err := service.GenerateAndSend(ctx, "register", "user-123", "demo@lumo.app"); err != nil {
		t.Fatalf("GenerateAndSend failed: %v", err)
	}
	if len(sender.lastCode) != 6 {
		t.Fatalf("expected a 6-digit code, got %q", sender.lastCode)
	}
	if sender.lastDestination != "demo@lumo.app" {
		t.Errorf("expected destination demo@lumo.app, got %s", sender.lastDestination)
	}

	if err := service.Verify(ctx, "register", "user-123", sender.lastCode); err != nil {
		t.Fatalf("Verify with correct code failed: %v", err)
	}

	// Codes are single use.
	if err := service.Verify(ctx, "register", "user-123", sender.lastCode); !errors.Is(err, ErrCodeNotFound) {
		t.Errorf("expected ErrCodeNotFound on reuse, got %v", err)
	}
}

func TestVerifyWrongCode(t *testing.T) {
	ctx := context.Background()
	service, sender := newTestService(t)

	if err := service.GenerateAndSend(ctx, "register", "user-123", "demo@lumo.app"); err != nil {
		t.Fatalf("GenerateAndSend failed: %v", err)
	}

	wrongCode := "000000"
	if wrongCode == sender.lastCode {
		wrongCode = "000001"
	}

	if err := service.Verify(ctx, "register", "user-123", wrongCode); !errors.Is(err, ErrCodeInvalid) {
		t.Errorf("expected ErrCodeInvalid, got %v", err)
	}

	// Correct code still works after one failed attempt.
	if err := service.Verify(ctx, "register", "user-123", sender.lastCode); err != nil {
		t.Errorf("Verify with correct code after a failure failed: %v", err)
	}
}

func TestVerifyLocksAfterMaxAttempts(t *testing.T) {
	ctx := context.Background()
	service, sender := newTestService(t)

	if err := service.GenerateAndSend(ctx, "register", "user-123", "demo@lumo.app"); err != nil {
		t.Fatalf("GenerateAndSend failed: %v", err)
	}

	wrongCode := "000000"
	if wrongCode == sender.lastCode {
		wrongCode = "000001"
	}

	var lastError error
	for attempt := 0; attempt < maxVerificationAttempts; attempt++ {
		lastError = service.Verify(ctx, "register", "user-123", wrongCode)
	}
	if !errors.Is(lastError, ErrTooManyAttempts) {
		t.Errorf("expected ErrTooManyAttempts after %d failures, got %v", maxVerificationAttempts, lastError)
	}

	// Even the correct code is rejected once locked out.
	if err := service.Verify(ctx, "register", "user-123", sender.lastCode); errors.Is(err, nil) {
		t.Error("expected correct code to be rejected after lockout")
	}
}
