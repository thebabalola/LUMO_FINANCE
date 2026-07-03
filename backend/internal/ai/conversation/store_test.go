package conversation

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/redis/go-redis/v9"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	miniRedisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{Addr: miniRedisServer.Addr()})
	return NewStore(redisClient, time.Hour)
}

func TestSaveAndLoadRoundTrip(t *testing.T) {
	store := newTestStore(t)
	ctx := context.Background()

	originalMessages := []anthropic.MessageParam{
		anthropic.NewUserMessage(anthropic.NewTextBlock("What is my balance?")),
	}
	if err := store.Save(ctx, "user-123", "conversation-1", originalMessages); err != nil {
		t.Fatalf("Save failed: %v", err)
	}

	loadedMessages, err := store.Load(ctx, "user-123", "conversation-1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if len(loadedMessages) != 1 {
		t.Fatalf("expected 1 message, got %d", len(loadedMessages))
	}
	if loadedMessages[0].Role != anthropic.MessageParamRoleUser {
		t.Errorf("expected user role, got %s", loadedMessages[0].Role)
	}
}

func TestLoadMissingConversationReturnsEmpty(t *testing.T) {
	store := newTestStore(t)

	loadedMessages, err := store.Load(context.Background(), "user-123", "no-such-conversation")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}
	if len(loadedMessages) != 0 {
		t.Errorf("expected empty history, got %d messages", len(loadedMessages))
	}
}

func TestTrimmingKeepsRecentMessagesAndUserBoundary(t *testing.T) {
	store := newTestStore(t)
	ctx := context.Background()

	var longConversation []anthropic.MessageParam
	for turnNumber := 0; turnNumber < 30; turnNumber++ {
		longConversation = append(longConversation,
			anthropic.NewUserMessage(anthropic.NewTextBlock(fmt.Sprintf("user message %d", turnNumber))),
			anthropic.NewAssistantMessage(anthropic.NewTextBlock(fmt.Sprintf("assistant reply %d", turnNumber))),
		)
	}

	if err := store.Save(ctx, "user-123", "conversation-1", longConversation); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	loadedMessages, err := store.Load(ctx, "user-123", "conversation-1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	if len(loadedMessages) > maxStoredMessages {
		t.Errorf("expected at most %d messages after trimming, got %d", maxStoredMessages, len(loadedMessages))
	}
	if loadedMessages[0].Role != anthropic.MessageParamRoleUser {
		t.Errorf("expected trimmed history to start with a user message, got %s", loadedMessages[0].Role)
	}
}

func TestTrimmingNeverOrphansToolResults(t *testing.T) {
	store := newTestStore(t)
	ctx := context.Background()

	// Build a conversation where the trim cap lands in the middle of
	// tool_use/tool_result pairs: user text, then many assistant tool_use +
	// user tool_result pairs, then a final exchange.
	var conversationMessages []anthropic.MessageParam
	conversationMessages = append(conversationMessages, anthropic.NewUserMessage(anthropic.NewTextBlock("start")))
	for pairNumber := 0; pairNumber < 25; pairNumber++ {
		toolUseID := fmt.Sprintf("tool_use_%d", pairNumber)
		conversationMessages = append(conversationMessages,
			anthropic.NewAssistantMessage(anthropic.NewTextBlock("calling a tool")),
			anthropic.NewUserMessage(anthropic.NewToolResultBlock(toolUseID, "{}", false)),
		)
	}
	conversationMessages = append(conversationMessages,
		anthropic.NewUserMessage(anthropic.NewTextBlock("final question")),
		anthropic.NewAssistantMessage(anthropic.NewTextBlock("final answer")),
	)

	if err := store.Save(ctx, "user-123", "conversation-1", conversationMessages); err != nil {
		t.Fatalf("Save failed: %v", err)
	}
	loadedMessages, err := store.Load(ctx, "user-123", "conversation-1")
	if err != nil {
		t.Fatalf("Load failed: %v", err)
	}

	// The first message must open a clean user turn — never a tool_result.
	firstMessage := loadedMessages[0]
	if firstMessage.Role != anthropic.MessageParamRoleUser {
		t.Fatalf("expected trimmed history to start with a user message, got %s", firstMessage.Role)
	}
	for _, contentBlock := range firstMessage.Content {
		if contentBlock.OfToolResult != nil {
			t.Error("trimmed history starts with an orphaned tool_result")
		}
	}
}
