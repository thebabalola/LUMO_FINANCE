package pending

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const pendingActionTTL = 5 * time.Minute

var ErrPendingActionNotFound = fmt.Errorf("pending action not found or expired")

// Action is a money-moving request the AI prepared but which only executes
// after the user confirms with their PIN. The stored values — not anything
// the model says later — are what actually gets executed.
type Action struct {
	ActionID       string    `json:"action_id"`
	UserID         string    `json:"user_id"`
	ConversationID string    `json:"conversation_id"`
	ToolName       string    `json:"tool_name"`
	Type           string    `json:"type"` // transfer, airtime, data, bill
	AmountKobo     int64     `json:"amount_kobo"`
	Recipient      string    `json:"recipient"`
	RecipientName  string    `json:"recipient_name,omitempty"`
	Summary        string    `json:"summary"`
	ExpiresAt      time.Time `json:"expires_at"`

	// Transfer fields
	BankCode      string `json:"bank_code,omitempty"`
	AccountNumber string `json:"account_number,omitempty"`

	// Airtime/data fields
	PhoneNumber string `json:"phone_number,omitempty"`
	Network     string `json:"network,omitempty"`
	PlanCode    string `json:"plan_code,omitempty"`

	// Bill fields
	BillerCode string `json:"biller_code,omitempty"`
	CustomerID string `json:"customer_id,omitempty"`
}

type Store struct {
	redisClient *redis.Client
}

func NewStore(redisClient *redis.Client) *Store {
	return &Store{redisClient: redisClient}
}

func pendingActionKey(userID string, actionID string) string {
	return fmt.Sprintf("chat:pending_action:%s:%s", userID, actionID)
}

func (store *Store) Save(ctx context.Context, action *Action) error {
	action.ExpiresAt = time.Now().Add(pendingActionTTL)
	actionJSON, err := json.Marshal(action)
	if err != nil {
		return err
	}
	return store.redisClient.Set(ctx, pendingActionKey(action.UserID, action.ActionID), actionJSON, pendingActionTTL).Err()
}

// Consume atomically fetches and deletes the action so it can only ever be
// executed once, even under concurrent confirmation attempts.
func (store *Store) Consume(ctx context.Context, userID string, actionID string) (*Action, error) {
	actionJSON, err := store.redisClient.GetDel(ctx, pendingActionKey(userID, actionID)).Result()
	if err == redis.Nil {
		return nil, ErrPendingActionNotFound
	}
	if err != nil {
		return nil, err
	}

	var action Action
	if err := json.Unmarshal([]byte(actionJSON), &action); err != nil {
		return nil, err
	}
	return &action, nil
}

func (store *Store) Delete(ctx context.Context, userID string, actionID string) error {
	deletedCount, err := store.redisClient.Del(ctx, pendingActionKey(userID, actionID)).Result()
	if err != nil {
		return err
	}
	if deletedCount == 0 {
		return ErrPendingActionNotFound
	}
	return nil
}
