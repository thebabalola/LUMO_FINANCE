package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/vatilize-labs/lumo-finance/internal/ai/claude"
	"github.com/vatilize-labs/lumo-finance/internal/ai/conversation"
	"github.com/vatilize-labs/lumo-finance/internal/ai/pending"
	"github.com/vatilize-labs/lumo-finance/internal/ai/tools"
	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/auth"
	"github.com/vatilize-labs/lumo-finance/internal/models"
	"github.com/vatilize-labs/lumo-finance/internal/services"
)

// The agentic loop stops after this many model calls per user message so a
// misbehaving conversation cannot spin forever.
const maxAgenticIterations = 5

const (
	maxPinAttempts    = 5
	pinLockoutWindow  = 15 * time.Minute
)

var (
	ErrPinLocked    = fmt.Errorf("too many incorrect PIN attempts — try again in 15 minutes")
	ErrPinIncorrect = fmt.Errorf("incorrect transaction PIN")
)

type ChatService struct {
	messagesClient     claude.MessagesClient
	conversationStore  *conversation.Store
	pendingActionStore *pending.Store
	toolExecutor       *tools.ReadOnlyToolExecutor
	authService        *services.AuthService
	transactionService *services.TransactionService
	auditRecorder      *audit.Recorder
	redisClient        *redis.Client
}

type ChatResult struct {
	ConversationID string          `json:"conversation_id"`
	Message        string          `json:"message"`
	PendingAction  *pending.Action `json:"pending_action,omitempty"`
}

type ConfirmResult struct {
	Transaction *models.TransactionResponse `json:"transaction"`
	Message     string                      `json:"message"`
}

func NewChatService(
	messagesClient claude.MessagesClient,
	conversationStore *conversation.Store,
	pendingActionStore *pending.Store,
	toolExecutor *tools.ReadOnlyToolExecutor,
	authService *services.AuthService,
	transactionService *services.TransactionService,
	auditRecorder *audit.Recorder,
	redisClient *redis.Client,
) *ChatService {
	return &ChatService{
		messagesClient:     messagesClient,
		conversationStore:  conversationStore,
		pendingActionStore: pendingActionStore,
		toolExecutor:       toolExecutor,
		authService:        authService,
		transactionService: transactionService,
		auditRecorder:      auditRecorder,
		redisClient:        redisClient,
	}
}

// HandleChatMessage runs the agentic loop: read-only tools execute
// immediately; the first money-moving tool call becomes a pending action
// the user must confirm with their PIN — it is never executed here.
func (service *ChatService) HandleChatMessage(ctx context.Context, userID string, conversationID string, userMessage string, requestInfo audit.RequestInfo) (*ChatResult, error) {
	if conversationID == "" {
		conversationID = uuid.NewString()
	}

	conversationMessages, err := service.conversationStore.Load(ctx, userID, conversationID)
	if err != nil {
		return nil, err
	}
	conversationMessages = append(conversationMessages, anthropic.NewUserMessage(anthropic.NewTextBlock(userMessage)))

	service.auditRecorder.Record(ctx, audit.Event{
		UserID: userID, EventType: "chat.message",
		ResourceType: "conversation", ResourceID: conversationID,
		IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
	})

	var assistantText strings.Builder
	var pendingAction *pending.Action

	for iteration := 0; iteration < maxAgenticIterations; iteration++ {
		modelResponse, err := service.messagesClient.CreateMessage(ctx, conversationMessages, tools.Definitions())
		if err != nil {
			return nil, fmt.Errorf("AI request failed: %w", err)
		}
		conversationMessages = append(conversationMessages, modelResponse.ToParam())

		toolResults, responseText, proposedAction, err := service.processResponseBlocks(ctx, userID, conversationID, modelResponse, pendingAction)
		if err != nil {
			return nil, err
		}
		if responseText != "" {
			if assistantText.Len() > 0 {
				assistantText.WriteString("\n")
			}
			assistantText.WriteString(responseText)
		}
		if proposedAction != nil {
			pendingAction = proposedAction
			service.auditRecorder.Record(ctx, audit.Event{
				UserID: userID, EventType: "chat.action_proposed",
				ResourceType: "conversation", ResourceID: conversationID,
				IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
				Metadata: map[string]interface{}{
					"action_id": proposedAction.ActionID, "type": proposedAction.Type,
					"amount_kobo": proposedAction.AmountKobo,
				},
			})
		}

		if modelResponse.StopReason != anthropic.StopReasonToolUse {
			break
		}
		// Tool calls were made: text so far was interim narration, the
		// final user-facing reply comes after the tool results.
		assistantText.Reset()
		conversationMessages = append(conversationMessages, anthropic.NewUserMessage(toolResults...))
	}

	if err := service.conversationStore.Save(ctx, userID, conversationID, conversationMessages); err != nil {
		return nil, err
	}

	return &ChatResult{
		ConversationID: conversationID,
		Message:        assistantText.String(),
		PendingAction:  pendingAction,
	}, nil
}

// processResponseBlocks walks one model response: read-only tool_use blocks
// are executed, the first money-moving one becomes a pending action, and any
// further money-moving calls in the same turn are refused.
func (service *ChatService) processResponseBlocks(ctx context.Context, userID string, conversationID string, modelResponse *anthropic.Message, existingAction *pending.Action) ([]anthropic.ContentBlockParamUnion, string, *pending.Action, error) {
	var toolResults []anthropic.ContentBlockParamUnion
	var responseText strings.Builder
	var proposedAction *pending.Action

	for _, contentBlock := range modelResponse.Content {
		switch contentBlock.Type {
		case "text":
			responseText.WriteString(contentBlock.Text)

		case "tool_use":
			if !tools.IsMoneyMovingTool(contentBlock.Name) {
				resultJSON, isError := service.toolExecutor.Execute(ctx, userID, contentBlock.Name, contentBlock.Input)
				toolResults = append(toolResults, anthropic.NewToolResultBlock(contentBlock.ID, resultJSON, isError))
				continue
			}

			if existingAction != nil || proposedAction != nil {
				toolResults = append(toolResults, anthropic.NewToolResultBlock(contentBlock.ID,
					`{"error": "only one payment can be prepared at a time — ask the user to confirm or cancel the current one first"}`, true))
				continue
			}

			action, err := buildPendingAction(userID, conversationID, contentBlock.Name, contentBlock.Input)
			if err != nil {
				toolResults = append(toolResults, anthropic.NewToolResultBlock(contentBlock.ID,
					fmt.Sprintf(`{"error": %q}`, err.Error()), true))
				continue
			}
			if err := service.pendingActionStore.Save(ctx, action); err != nil {
				return nil, "", nil, err
			}
			proposedAction = action
			toolResults = append(toolResults, anthropic.NewToolResultBlock(contentBlock.ID,
				fmt.Sprintf(`{"status": "awaiting_confirmation", "action_id": %q, "detail": "Transaction prepared. Summarize the details for the user and tell them to confirm with their PIN in the app. Do not claim it is completed."}`, action.ActionID),
				false))
		}
	}
	return toolResults, responseText.String(), proposedAction, nil
}

func buildPendingAction(userID string, conversationID string, toolName string, rawToolInput json.RawMessage) (*pending.Action, error) {
	action := &pending.Action{
		ActionID:       uuid.NewString(),
		UserID:         userID,
		ConversationID: conversationID,
		ToolName:       toolName,
	}

	switch toolName {
	case tools.ToolTransferMoney:
		var input struct {
			AmountKobo    int64  `json:"amount_kobo"`
			BankCode      string `json:"bank_code"`
			AccountNumber string `json:"account_number"`
			RecipientName string `json:"recipient_name"`
			Narration     string `json:"narration"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid transferMoney input: %w", err)
		}
		if input.AmountKobo <= 0 || len(input.AccountNumber) != 10 {
			return nil, fmt.Errorf("transfer requires a positive amount and a 10-digit account number")
		}
		action.Type = "transfer"
		action.AmountKobo = input.AmountKobo
		action.BankCode = input.BankCode
		action.AccountNumber = input.AccountNumber
		action.RecipientName = input.RecipientName
		action.Recipient = fmt.Sprintf("%s (bank %s)", input.AccountNumber, input.BankCode)
		action.Summary = fmt.Sprintf("Transfer %s to %s — %s", formatNaira(input.AmountKobo), input.RecipientName, action.Recipient)

	case tools.ToolBuyAirtime:
		var input struct {
			AmountKobo  int64  `json:"amount_kobo"`
			PhoneNumber string `json:"phone_number"`
			Network     string `json:"network"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid buyAirtime input: %w", err)
		}
		if input.AmountKobo <= 0 || input.PhoneNumber == "" {
			return nil, fmt.Errorf("airtime purchase requires a positive amount and a phone number")
		}
		action.Type = "airtime"
		action.AmountKobo = input.AmountKobo
		action.PhoneNumber = input.PhoneNumber
		action.Network = input.Network
		action.Recipient = input.PhoneNumber
		action.Summary = fmt.Sprintf("Buy %s %s airtime for %s", formatNaira(input.AmountKobo), strings.ToUpper(input.Network), input.PhoneNumber)

	case tools.ToolBuyData:
		var input struct {
			AmountKobo  int64  `json:"amount_kobo"`
			PhoneNumber string `json:"phone_number"`
			Network     string `json:"network"`
			PlanCode    string `json:"plan_code"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid buyData input: %w", err)
		}
		if input.AmountKobo <= 0 || input.PhoneNumber == "" || input.PlanCode == "" {
			return nil, fmt.Errorf("data purchase requires a positive amount, phone number, and plan code")
		}
		action.Type = "data"
		action.AmountKobo = input.AmountKobo
		action.PhoneNumber = input.PhoneNumber
		action.Network = input.Network
		action.PlanCode = input.PlanCode
		action.Recipient = input.PhoneNumber
		action.Summary = fmt.Sprintf("Buy %s data plan (%s) for %s", strings.ToUpper(input.Network), input.PlanCode, input.PhoneNumber)

	case tools.ToolPayBill:
		var input struct {
			AmountKobo int64  `json:"amount_kobo"`
			BillerCode string `json:"biller_code"`
			CustomerID string `json:"customer_id"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid payBill input: %w", err)
		}
		if input.AmountKobo <= 0 || input.BillerCode == "" || input.CustomerID == "" {
			return nil, fmt.Errorf("bill payment requires a positive amount, biller code, and customer ID")
		}
		action.Type = "bill"
		action.AmountKobo = input.AmountKobo
		action.BillerCode = input.BillerCode
		action.CustomerID = input.CustomerID
		action.Recipient = fmt.Sprintf("%s (%s)", input.BillerCode, input.CustomerID)
		action.Summary = fmt.Sprintf("Pay %s to %s for customer %s", formatNaira(input.AmountKobo), input.BillerCode, input.CustomerID)

	default:
		return nil, fmt.Errorf("unknown money-moving tool: %s", toolName)
	}
	return action, nil
}

// ConfirmPendingAction verifies the user's PIN (with lockout) and executes
// the stored action. The executed amount and recipient come from the stored
// pending action — never from a second model pass.
func (service *ChatService) ConfirmPendingAction(ctx context.Context, userID string, actionID string, pin string, requestInfo audit.RequestInfo) (*ConfirmResult, error) {
	if err := service.checkPinWithLockout(ctx, userID, pin, requestInfo); err != nil {
		return nil, err
	}

	// Consume is atomic (GETDEL): the action can only execute once.
	action, err := service.pendingActionStore.Consume(ctx, userID, actionID)
	if err != nil {
		return nil, err
	}

	transaction, err := service.transactionService.Execute(ctx, userID, services.ExecuteTransactionInput{
		Type:          action.Type,
		AmountKobo:    action.AmountKobo,
		Recipient:     action.Recipient,
		Description:   action.Summary,
		BankCode:      action.BankCode,
		AccountNumber: action.AccountNumber,
		RecipientName: action.RecipientName,
		PhoneNumber:   action.PhoneNumber,
		Network:       action.Network,
		PlanCode:      action.PlanCode,
		BillerCode:    action.BillerCode,
		CustomerID:    action.CustomerID,
	}, requestInfo)
	if err != nil {
		service.appendSystemNote(ctx, userID, action.ConversationID,
			fmt.Sprintf("[system] The prepared transaction failed: %v", err))
		return nil, err
	}

	// Record the outcome in conversation memory so follow-up chat turns
	// know the payment went through.
	service.appendSystemNote(ctx, userID, action.ConversationID,
		fmt.Sprintf("[system] Transaction completed: %s (reference %s)", action.Summary, transaction.Reference))

	return &ConfirmResult{
		Transaction: transaction,
		Message:     fmt.Sprintf("Done! %s. Reference: %s", action.Summary, transaction.Reference),
	}, nil
}

func (service *ChatService) CancelPendingAction(ctx context.Context, userID string, actionID string, requestInfo audit.RequestInfo) error {
	if err := service.pendingActionStore.Delete(ctx, userID, actionID); err != nil {
		return err
	}
	service.auditRecorder.Record(ctx, audit.Event{
		UserID: userID, EventType: "chat.action_cancelled",
		ResourceType: "pending_action", ResourceID: actionID,
		IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
	})
	return nil
}

func (service *ChatService) checkPinWithLockout(ctx context.Context, userID string, pin string, requestInfo audit.RequestInfo) error {
	lockKey := "auth:pin_lock:" + userID
	attemptsKey := "auth:pin_attempts:" + userID

	if locked, _ := service.redisClient.Exists(ctx, lockKey).Result(); locked > 0 {
		return ErrPinLocked
	}

	pinHash, err := service.authService.GetTransactionPinHash(ctx, userID)
	if err != nil {
		return err
	}

	if !auth.CompareTransactionPin(pinHash, pin) {
		failedAttempts, _ := service.redisClient.Incr(ctx, attemptsKey).Result()
		service.redisClient.Expire(ctx, attemptsKey, pinLockoutWindow)

		service.auditRecorder.Record(ctx, audit.Event{
			UserID: userID, EventType: "auth.pin_failed",
			IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
			Metadata: map[string]interface{}{"failed_attempts": failedAttempts},
		})

		if failedAttempts >= maxPinAttempts {
			service.redisClient.Set(ctx, lockKey, "1", pinLockoutWindow)
			service.auditRecorder.Record(ctx, audit.Event{
				UserID: userID, EventType: "auth.pin_locked",
				IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
			})
			return ErrPinLocked
		}
		return ErrPinIncorrect
	}

	service.redisClient.Del(ctx, attemptsKey)
	return nil
}

func (service *ChatService) appendSystemNote(ctx context.Context, userID string, conversationID string, note string) {
	conversationMessages, err := service.conversationStore.Load(ctx, userID, conversationID)
	if err != nil {
		return
	}
	conversationMessages = append(conversationMessages, anthropic.NewUserMessage(anthropic.NewTextBlock(note)))
	// Best-effort: a note that fails to persist should not fail the request.
	_ = service.conversationStore.Save(ctx, userID, conversationID, conversationMessages)
}

func formatNaira(amountKobo int64) string {
	naira := amountKobo / 100
	kobo := amountKobo % 100

	// Insert thousands separators into the naira part.
	nairaDigits := fmt.Sprintf("%d", naira)
	var withSeparators strings.Builder
	for index, digit := range nairaDigits {
		if index > 0 && (len(nairaDigits)-index)%3 == 0 {
			withSeparators.WriteRune(',')
		}
		withSeparators.WriteRune(digit)
	}
	return fmt.Sprintf("₦%s.%02d", withSeparators.String(), kobo)
}
