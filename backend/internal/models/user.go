package models

import "time"

type User struct {
	ID        string    `db:"id"`
	Email     string    `db:"email"`
	Name      string    `db:"name"`
	Phone     string    `db:"phone"`
	Password  string    `db:"password"`
	Status    string    `db:"status"` // active, suspended, deleted
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
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
