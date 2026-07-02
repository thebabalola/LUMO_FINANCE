package models

import "time"

type Transaction struct {
	ID              string    `db:"id" json:"id"`
	UserID          string    `db:"user_id" json:"user_id"`
	Type            string    `db:"type" json:"type"` // transfer, airtime, data, bill
	Amount          int64     `db:"amount" json:"amount"` // in kobo/cents
	Recipient       string    `db:"recipient" json:"recipient"`
	Description     string    `db:"description" json:"description"`
	Status          string    `db:"status" json:"status"` // pending, completed, failed
	Reference       string    `db:"reference" json:"reference"` // Nomba reference
	NombaReference  string    `db:"nomba_reference" json:"nomba_reference"`
	ErrorMessage    string    `db:"error_message" json:"error_message,omitempty"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time `db:"updated_at" json:"updated_at"`
	CompletedAt     *time.Time `db:"completed_at" json:"completed_at,omitempty"`
}

type TransactionRequest struct {
	Type        string `json:"type" validate:"required,oneof=transfer airtime data bill"`
	Amount      int64  `json:"amount" validate:"required,gt=0"`
	Recipient   string `json:"recipient" validate:"required"`
	Description string `json:"description"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

type TransactionResponse struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Amount    int64     `json:"amount"`
	Recipient string    `json:"recipient"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	Reference string    `json:"reference"`
}

func (t *Transaction) ToResponse() *TransactionResponse {
	return &TransactionResponse{
		ID:        t.ID,
		Type:      t.Type,
		Amount:    t.Amount,
		Recipient: t.Recipient,
		Status:    t.Status,
		CreatedAt: t.CreatedAt,
		Reference: t.Reference,
	}
}
