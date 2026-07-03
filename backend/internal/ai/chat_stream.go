package ai

import (
	"context"
	"fmt"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/google/uuid"

	"github.com/vatilize-labs/lumo-finance/internal/ai/pending"
	"github.com/vatilize-labs/lumo-finance/internal/ai/tools"
	"github.com/vatilize-labs/lumo-finance/internal/audit"
)

// StreamEmitter receives server-sent events as the streaming loop runs.
// Event names: text_delta, tool_activity, pending_action, done, error.
type StreamEmitter func(eventName string, payload interface{})

// HandleChatMessageStream is the SSE variant of HandleChatMessage: the same
// agentic loop, but final-answer text is emitted as deltas while tool-use
// iterations surface only as tool_activity markers.
func (service *ChatService) HandleChatMessageStream(ctx context.Context, userID string, conversationID string, userMessage string, requestInfo audit.RequestInfo, emit StreamEmitter) {
	if conversationID == "" {
		conversationID = uuid.NewString()
	}

	conversationMessages, err := service.conversationStore.Load(ctx, userID, conversationID)
	if err != nil {
		emit("error", map[string]string{"error": "failed to load conversation"})
		return
	}
	conversationMessages = append(conversationMessages, anthropic.NewUserMessage(anthropic.NewTextBlock(userMessage)))

	service.auditRecorder.Record(ctx, audit.Event{
		UserID: userID, EventType: "chat.message",
		ResourceType: "conversation", ResourceID: conversationID,
		IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
	})

	var existingAction *pending.Action
	for iteration := 0; iteration < maxAgenticIterations; iteration++ {
		modelStream := service.messagesClient.StreamMessage(ctx, conversationMessages, tools.Definitions())

		accumulatedMessage := anthropic.Message{}
		for modelStream.Next() {
			streamEvent := modelStream.Current()
			if err := accumulatedMessage.Accumulate(streamEvent); err != nil {
				emit("error", map[string]string{"error": "failed to read AI response"})
				return
			}
			if streamEvent.Type == "content_block_delta" && streamEvent.Delta.Type == "text_delta" && streamEvent.Delta.Text != "" {
				emit("text_delta", map[string]string{"text": streamEvent.Delta.Text})
			}
		}
		if err := modelStream.Err(); err != nil {
			emit("error", map[string]string{"error": fmt.Sprintf("AI request failed: %v", err)})
			return
		}

		conversationMessages = append(conversationMessages, accumulatedMessage.ToParam())

		toolResults, _, proposedAction, err := service.processResponseBlocks(ctx, userID, conversationID, &accumulatedMessage, existingAction)
		if err != nil {
			emit("error", map[string]string{"error": "failed to process AI response"})
			return
		}
		if proposedAction != nil {
			existingAction = proposedAction
			service.auditRecorder.Record(ctx, audit.Event{
				UserID: userID, EventType: "chat.action_proposed",
				ResourceType: "conversation", ResourceID: conversationID,
				IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
				Metadata: map[string]interface{}{
					"action_id": proposedAction.ActionID, "type": proposedAction.Type,
					"amount_kobo": proposedAction.AmountKobo,
				},
			})
			emit("pending_action", proposedAction)
		}

		if accumulatedMessage.StopReason != anthropic.StopReasonToolUse {
			break
		}
		for _, toolResult := range toolResults {
			if toolResult.OfToolResult != nil {
				emit("tool_activity", map[string]string{"tool_use_id": toolResult.OfToolResult.ToolUseID})
			}
		}
		conversationMessages = append(conversationMessages, anthropic.NewUserMessage(toolResults...))
	}

	if err := service.conversationStore.Save(ctx, userID, conversationID, conversationMessages); err != nil {
		emit("error", map[string]string{"error": "failed to save conversation"})
		return
	}
	emit("done", map[string]string{"conversation_id": conversationID})
}
