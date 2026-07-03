package ai

import (
	"context"
	"encoding/json"
	"strings"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/packages/ssestream"
	"github.com/redis/go-redis/v9"

	"github.com/vatilize-labs/lumo-finance/internal/ai/conversation"
	"github.com/vatilize-labs/lumo-finance/internal/ai/pending"
	"github.com/vatilize-labs/lumo-finance/internal/audit"
)

// fakeMessagesClient returns scripted responses in order.
type fakeMessagesClient struct {
	scriptedResponses []string // raw Message JSON
	callCount         int
}

func (fake *fakeMessagesClient) CreateMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) (*anthropic.Message, error) {
	if fake.callCount >= len(fake.scriptedResponses) {
		panic("fakeMessagesClient: more calls than scripted responses")
	}
	var message anthropic.Message
	if err := json.Unmarshal([]byte(fake.scriptedResponses[fake.callCount]), &message); err != nil {
		panic("fakeMessagesClient: bad scripted response: " + err.Error())
	}
	fake.callCount++
	return &message, nil
}

func (fake *fakeMessagesClient) StreamMessage(ctx context.Context, conversationMessages []anthropic.MessageParam, tools []anthropic.ToolUnionParam) *ssestream.Stream[anthropic.MessageStreamEventUnion] {
	panic("not used in these tests")
}

func newTestChatService(t *testing.T, scriptedResponses ...string) (*ChatService, *redis.Client) {
	t.Helper()
	miniRedisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{Addr: miniRedisServer.Addr()})

	// transactionService and authService are nil on purpose: if the chat
	// loop ever tried to execute a money-moving tool it would panic, which
	// is exactly what these tests assert cannot happen.
	return NewChatService(
		&fakeMessagesClient{scriptedResponses: scriptedResponses},
		conversation.NewStore(redisClient, time.Hour),
		pending.NewStore(redisClient),
		nil, // read-only executor unused: scripted responses only use gated tools
		nil,
		nil,
		audit.NewRecorder(nil),
		redisClient,
	), redisClient
}

const transferToolUseResponse = `{
	"role": "assistant",
	"stop_reason": "tool_use",
	"content": [
		{"type": "text", "text": "Let me prepare that transfer."},
		{"type": "tool_use", "id": "tool_use_1", "name": "transferMoney",
		 "input": {"amount_kobo": 500000, "bank_code": "058", "account_number": "0123456789", "recipient_name": "DAVID OKAFOR"}}
	]
}`

const finalTextResponse = `{
	"role": "assistant",
	"stop_reason": "end_turn",
	"content": [
		{"type": "text", "text": "I've prepared a transfer of ₦5,000.00 to DAVID OKAFOR. Confirm with your PIN to send it."}
	]
}`

func TestMoneyMovingToolCreatesPendingActionWithoutExecuting(t *testing.T) {
	chatService, redisClient := newTestChatService(t, transferToolUseResponse, finalTextResponse)

	chatResult, err := chatService.HandleChatMessage(context.Background(),
		"user-123", "", "Send 5000 naira to David", audit.RequestInfo{})
	if err != nil {
		t.Fatalf("HandleChatMessage failed: %v", err)
	}

	if chatResult.PendingAction == nil {
		t.Fatal("expected a pending action for a money-moving tool call")
	}
	if chatResult.PendingAction.Type != "transfer" {
		t.Errorf("expected pending action type transfer, got %s", chatResult.PendingAction.Type)
	}
	if chatResult.PendingAction.AmountKobo != 500000 {
		t.Errorf("expected amount 500000 kobo, got %d", chatResult.PendingAction.AmountKobo)
	}
	if !strings.Contains(chatResult.Message, "Confirm with your PIN") {
		t.Errorf("expected the final message to ask for PIN confirmation, got %q", chatResult.Message)
	}

	// The pending action must be stored in Redis awaiting confirmation.
	pendingKeys, _ := redisClient.Keys(context.Background(), "chat:pending_action:user-123:*").Result()
	if len(pendingKeys) != 1 {
		t.Errorf("expected exactly one stored pending action, found %d", len(pendingKeys))
	}
	// Reaching here without a nil-pointer panic proves the transaction
	// service was never invoked.
}

func TestOnlyOnePendingActionPerTurn(t *testing.T) {
	doubleToolUseResponse := `{
		"role": "assistant",
		"stop_reason": "tool_use",
		"content": [
			{"type": "tool_use", "id": "tool_use_1", "name": "transferMoney",
			 "input": {"amount_kobo": 500000, "bank_code": "058", "account_number": "0123456789", "recipient_name": "A"}},
			{"type": "tool_use", "id": "tool_use_2", "name": "buyAirtime",
			 "input": {"amount_kobo": 100000, "phone_number": "+2348012345678", "network": "mtn"}}
		]
	}`

	chatService, redisClient := newTestChatService(t, doubleToolUseResponse, finalTextResponse)

	chatResult, err := chatService.HandleChatMessage(context.Background(),
		"user-123", "", "Send money and buy airtime", audit.RequestInfo{})
	if err != nil {
		t.Fatalf("HandleChatMessage failed: %v", err)
	}

	if chatResult.PendingAction == nil || chatResult.PendingAction.Type != "transfer" {
		t.Fatal("expected the first gated tool (transfer) to become the pending action")
	}
	pendingKeys, _ := redisClient.Keys(context.Background(), "chat:pending_action:user-123:*").Result()
	if len(pendingKeys) != 1 {
		t.Errorf("expected exactly one pending action, found %d", len(pendingKeys))
	}
}

func TestPlainTextResponseHasNoPendingAction(t *testing.T) {
	plainResponse := `{
		"role": "assistant",
		"stop_reason": "end_turn",
		"content": [{"type": "text", "text": "Hello! How can I help with your finances today?"}]
	}`
	chatService, _ := newTestChatService(t, plainResponse)

	chatResult, err := chatService.HandleChatMessage(context.Background(),
		"user-123", "", "Hi", audit.RequestInfo{})
	if err != nil {
		t.Fatalf("HandleChatMessage failed: %v", err)
	}
	if chatResult.PendingAction != nil {
		t.Error("expected no pending action for a plain text response")
	}
	if chatResult.ConversationID == "" {
		t.Error("expected a generated conversation ID")
	}
	if !strings.Contains(chatResult.Message, "How can I help") {
		t.Errorf("unexpected message: %q", chatResult.Message)
	}
}

func TestConversationMemoryPersistsAcrossTurns(t *testing.T) {
	plainResponse := `{
		"role": "assistant",
		"stop_reason": "end_turn",
		"content": [{"type": "text", "text": "Noted."}]
	}`
	chatService, _ := newTestChatService(t, plainResponse, plainResponse)

	firstResult, err := chatService.HandleChatMessage(context.Background(),
		"user-123", "", "Remember my budget is 50k", audit.RequestInfo{})
	if err != nil {
		t.Fatalf("first turn failed: %v", err)
	}

	_, err = chatService.HandleChatMessage(context.Background(),
		"user-123", firstResult.ConversationID, "What did I say?", audit.RequestInfo{})
	if err != nil {
		t.Fatalf("second turn failed: %v", err)
	}

	storedMessages, err := chatService.conversationStore.Load(context.Background(), "user-123", firstResult.ConversationID)
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	// Two user messages + two assistant replies.
	if len(storedMessages) != 4 {
		t.Errorf("expected 4 stored messages, got %d", len(storedMessages))
	}
}
