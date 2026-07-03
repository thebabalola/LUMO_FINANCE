package conversation

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/redis/go-redis/v9"
)

// Keep at most this many messages per conversation. Trimming happens at
// user-message boundaries so a tool_result is never separated from its
// tool_use (the API rejects orphaned tool blocks).
const maxStoredMessages = 40

// Store keeps conversation history in Redis as one JSON blob per
// conversation, refreshed to the TTL on every write. Session memory only —
// durable chat history is intentionally out of scope.
type Store struct {
	redisClient     *redis.Client
	conversationTTL time.Duration
}

func NewStore(redisClient *redis.Client, conversationTTL time.Duration) *Store {
	return &Store{redisClient: redisClient, conversationTTL: conversationTTL}
}

func conversationKey(userID string, conversationID string) string {
	return fmt.Sprintf("chat:conversation:%s:%s", userID, conversationID)
}

func (store *Store) Load(ctx context.Context, userID string, conversationID string) ([]anthropic.MessageParam, error) {
	historyJSON, err := store.redisClient.Get(ctx, conversationKey(userID, conversationID)).Result()
	if err == redis.Nil {
		return []anthropic.MessageParam{}, nil
	}
	if err != nil {
		return nil, err
	}

	var conversationMessages []anthropic.MessageParam
	if err := json.Unmarshal([]byte(historyJSON), &conversationMessages); err != nil {
		// A corrupt blob should not brick the conversation — start fresh.
		return []anthropic.MessageParam{}, nil
	}
	return conversationMessages, nil
}

func (store *Store) Save(ctx context.Context, userID string, conversationID string, conversationMessages []anthropic.MessageParam) error {
	trimmedMessages := trimAtUserBoundary(conversationMessages)

	historyJSON, err := json.Marshal(trimmedMessages)
	if err != nil {
		return err
	}
	return store.redisClient.Set(ctx, conversationKey(userID, conversationID), historyJSON, store.conversationTTL).Err()
}

// trimAtUserBoundary drops the oldest messages once the cap is exceeded,
// cutting only at a message that opens a user turn with plain text so tool
// call/result pairs stay intact.
func trimAtUserBoundary(conversationMessages []anthropic.MessageParam) []anthropic.MessageParam {
	if len(conversationMessages) <= maxStoredMessages {
		return conversationMessages
	}

	earliestKeepableIndex := len(conversationMessages) - maxStoredMessages
	for index := earliestKeepableIndex; index < len(conversationMessages); index++ {
		if opensUserTurn(conversationMessages[index]) {
			return conversationMessages[index:]
		}
	}
	// No clean boundary found in range — keep everything rather than risk
	// orphaning a tool_result.
	return conversationMessages
}

func opensUserTurn(message anthropic.MessageParam) bool {
	if message.Role != anthropic.MessageParamRoleUser {
		return false
	}
	for _, contentBlock := range message.Content {
		if contentBlock.OfToolResult != nil {
			return false
		}
	}
	return true
}
