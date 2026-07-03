package auth

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func ValidateTransactionPinFormat(pin string) error {
	if len(pin) < 4 || len(pin) > 6 {
		return fmt.Errorf("transaction PIN must be 4 to 6 digits")
	}
	for _, character := range pin {
		if character < '0' || character > '9' {
			return fmt.Errorf("transaction PIN must contain only digits")
		}
	}
	return nil
}

func HashTransactionPin(pin string) (string, error) {
	if err := ValidateTransactionPinFormat(pin); err != nil {
		return "", err
	}
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(pin), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hashedBytes), nil
}

func CompareTransactionPin(pinHash string, pin string) bool {
	return bcrypt.CompareHashAndPassword([]byte(pinHash), []byte(pin)) == nil
}
