package otp

import (
	"context"
	"log"
)

// ConsoleSender logs the OTP to the server console. Development only —
// replace with a real email/SMS provider for production.
type ConsoleSender struct{}

func NewConsoleSender() *ConsoleSender {
	return &ConsoleSender{}
}

func (sender *ConsoleSender) SendOneTimePassword(ctx context.Context, destination string, code string) error {
	log.Printf("OTP for %s: %s", destination, code)
	return nil
}
