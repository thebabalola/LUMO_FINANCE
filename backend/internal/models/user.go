package models

import "time"

type User struct {
	ID                 string     `db:"id"`
	Email              string     `db:"email"`
	Name               string     `db:"name"`
	Phone              string     `db:"phone"`
	PasswordHash       string     `db:"password_hash"`
	TransactionPinHash *string    `db:"transaction_pin_hash"`
	Status             string     `db:"status"` // pending_verification, active, suspended, deleted
	VerifiedAt         *time.Time `db:"verified_at"`
	CreatedAt          time.Time  `db:"created_at"`
	UpdatedAt          time.Time  `db:"updated_at"`
}

type UserProfile struct {
	ID          string `json:"id"`
	Email       string `json:"email"`
	Name        string `json:"name"`
	Phone       string `json:"phone"`
	Status      string `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func (u *User) ToProfile() *UserProfile {
	return &UserProfile{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Phone:     u.Phone,
		Status:    u.Status,
		CreatedAt: u.CreatedAt,
	}
}
