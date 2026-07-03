package otp

import "context"

// Sender delivers a one-time password to the user. Swap the implementation
// (email, SMS provider) without touching the OTP service.
type Sender interface {
	SendOneTimePassword(ctx context.Context, destination string, code string) error
}
