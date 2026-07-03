package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/vatilize-labs/lumo-finance/internal/nomba"
	"github.com/vatilize-labs/lumo-finance/internal/services"
)

// ReadOnlyToolExecutor runs the tools that only read data. Money-moving
// tools are deliberately absent — they are gated behind PIN confirmation
// by the chat service.
type ReadOnlyToolExecutor struct {
	walletService      *services.WalletService
	transactionService *services.TransactionService
	analyticsService   *services.AnalyticsService
	nombaClient        nomba.Client
}

func NewReadOnlyToolExecutor(
	walletService *services.WalletService,
	transactionService *services.TransactionService,
	analyticsService *services.AnalyticsService,
	nombaClient nomba.Client,
) *ReadOnlyToolExecutor {
	return &ReadOnlyToolExecutor{
		walletService:      walletService,
		transactionService: transactionService,
		analyticsService:   analyticsService,
		nombaClient:        nombaClient,
	}
}

// Execute runs a read-only tool and returns its result as a JSON string for
// the model. The bool reports whether the result is an error message.
func (executor *ReadOnlyToolExecutor) Execute(ctx context.Context, userID string, toolName string, rawToolInput json.RawMessage) (string, bool) {
	result, err := executor.dispatch(ctx, userID, toolName, rawToolInput)
	if err != nil {
		return fmt.Sprintf(`{"error": %q}`, err.Error()), true
	}

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return fmt.Sprintf(`{"error": %q}`, err.Error()), true
	}
	return string(resultJSON), false
}

func (executor *ReadOnlyToolExecutor) dispatch(ctx context.Context, userID string, toolName string, rawToolInput json.RawMessage) (interface{}, error) {
	switch toolName {
	case ToolGetBalance:
		return executor.walletService.GetBalance(ctx, userID)

	case ToolGetTransactions:
		var input struct {
			Limit int `json:"limit"`
		}
		if len(rawToolInput) > 0 {
			if err := json.Unmarshal(rawToolInput, &input); err != nil {
				return nil, fmt.Errorf("invalid getTransactions input: %w", err)
			}
		}
		if input.Limit <= 0 {
			input.Limit = 10
		}
		if input.Limit > 50 {
			input.Limit = 50
		}
		return executor.transactionService.List(ctx, userID, input.Limit)

	case ToolAnalyzeSpending:
		var input struct {
			Period string `json:"period"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid analyzeSpending input: %w", err)
		}
		return executor.analyticsService.GetSpending(ctx, userID, input.Period)

	case ToolVerifyRecipient:
		var input struct {
			BankCode      string `json:"bank_code"`
			AccountNumber string `json:"account_number"`
		}
		if err := json.Unmarshal(rawToolInput, &input); err != nil {
			return nil, fmt.Errorf("invalid verifyRecipient input: %w", err)
		}
		return executor.nombaClient.LookupBankAccount(ctx, input.BankCode, input.AccountNumber)
	}
	return nil, fmt.Errorf("unknown read-only tool: %s", toolName)
}
