package otp

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

const maxVerificationAttempts = 5

var (
	ErrCodeNotFound        = fmt.Errorf("no OTP found — it may have expired")
	ErrCodeInvalid         = fmt.Errorf("incorrect OTP code")
	ErrTooManyAttempts     = fmt.Errorf("too many incorrect attempts — request a new OTP")
)

// OneTimePasswordService generates and verifies short-lived OTP codes.
// Only a bcrypt hash of the code is stored in Redis.
type OneTimePasswordService struct {
	redisClient *redis.Client
	sender      Sender
	codeTTL     time.Duration
}

type storedCode struct {
	CodeHash string `json:"code_hash"`
	Attempts int    `json:"attempts"`
}

func NewOneTimePasswordService(redisClient *redis.Client, sender Sender, codeTTL time.Duration) *OneTimePasswordService {
	return &OneTimePasswordService{redisClient: redisClient, sender: sender, codeTTL: codeTTL}
}

func codeKey(purpose string, userID string) string {
	return fmt.Sprintf("otp:%s:%s", purpose, userID)
}

func generateSixDigitCode() (string, error) {
	upperBound := big.NewInt(1000000)
	randomNumber, err := rand.Int(rand.Reader, upperBound)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", randomNumber.Int64()), nil
}

// GenerateAndSend creates a fresh code (replacing any existing one for the
// same purpose), stores its hash with a TTL, and delivers it via the Sender.
func (service *OneTimePasswordService) GenerateAndSend(ctx context.Context, purpose string, userID string, destination string) error {
	code, err := generateSixDigitCode()
	if err != nil {
		return err
	}

	// bcrypt cost 6 is enough here: codes are 6 digits and expire in minutes,
	// and higher costs would slow down every verification attempt.
	codeHashBytes, err := bcrypt.GenerateFromPassword([]byte(code), 6)
	if err != nil {
		return err
	}

	recordJSON, err := json.Marshal(storedCode{CodeHash: string(codeHashBytes)})
	if err != nil {
		return err
	}
	if err := service.redisClient.Set(ctx, codeKey(purpose, userID), recordJSON, service.codeTTL).Err(); err != nil {
		return err
	}

	return service.sender.SendOneTimePassword(ctx, destination, code)
}

// Verify checks the code and deletes it on success (single use). Each failed
// attempt is counted; after maxVerificationAttempts the code is invalidated.
func (service *OneTimePasswordService) Verify(ctx context.Context, purpose string, userID string, code string) error {
	key := codeKey(purpose, userID)
	recordJSON, err := service.redisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		return ErrCodeNotFound
	}
	if err != nil {
		return err
	}

	var record storedCode
	if err := json.Unmarshal([]byte(recordJSON), &record); err != nil {
		return err
	}

	if record.Attempts >= maxVerificationAttempts {
		service.redisClient.Del(ctx, key)
		return ErrTooManyAttempts
	}

	if bcrypt.CompareHashAndPassword([]byte(record.CodeHash), []byte(code)) != nil {
		record.Attempts++
		if updatedJSON, marshalErr := json.Marshal(record); marshalErr == nil {
			service.redisClient.Set(ctx, key, updatedJSON, redis.KeepTTL)
		}
		if record.Attempts >= maxVerificationAttempts {
			return ErrTooManyAttempts
		}
		return ErrCodeInvalid
	}

	service.redisClient.Del(ctx, key)
	return nil
}
