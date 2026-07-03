package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/models"
	"github.com/vatilize-labs/lumo-finance/internal/nomba"
)

var (
	ErrTransactionNotFound = fmt.Errorf("transaction not found")
	ErrInsufficientBalance = fmt.Errorf("insufficient wallet balance")
	ErrTransactionDeclined = fmt.Errorf("transaction was declined")
)

// TransactionService is the ONLY code path that moves money. It debits the
// wallet and records the transaction row atomically, then executes via the
// Nomba client.
type TransactionService struct {
	dbPool        *pgxpool.Pool
	nombaClient   nomba.Client
	auditRecorder *audit.Recorder
}

type ExecuteTransactionInput struct {
	Type        string // transfer, airtime, data, bill
	AmountKobo  int64
	Recipient   string // display string: account/phone/customer identifier
	Description string

	// Transfer fields
	BankCode      string
	AccountNumber string
	RecipientName string

	// Airtime/data fields
	PhoneNumber string
	Network     string
	PlanCode    string

	// Bill fields
	BillerCode string
	CustomerID string
}

func NewTransactionService(dbPool *pgxpool.Pool, nombaClient nomba.Client, auditRecorder *audit.Recorder) *TransactionService {
	return &TransactionService{dbPool: dbPool, nombaClient: nombaClient, auditRecorder: auditRecorder}
}

func (service *TransactionService) List(ctx context.Context, userID string, limit int) ([]*models.TransactionResponse, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := service.dbPool.Query(ctx,
		`SELECT id, type, amount, COALESCE(recipient, ''), status, COALESCE(reference, ''), created_at
		 FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
		userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := []*models.TransactionResponse{}
	for rows.Next() {
		var transaction models.TransactionResponse
		if err := rows.Scan(&transaction.ID, &transaction.Type, &transaction.Amount,
			&transaction.Recipient, &transaction.Status, &transaction.Reference, &transaction.CreatedAt); err != nil {
			return nil, err
		}
		transactions = append(transactions, &transaction)
	}
	return transactions, rows.Err()
}

func (service *TransactionService) GetByID(ctx context.Context, userID string, transactionID string) (*models.TransactionResponse, error) {
	var transaction models.TransactionResponse
	err := service.dbPool.QueryRow(ctx,
		`SELECT id, type, amount, COALESCE(recipient, ''), status, COALESCE(reference, ''), created_at
		 FROM transactions WHERE id = $1 AND user_id = $2`,
		transactionID, userID,
	).Scan(&transaction.ID, &transaction.Type, &transaction.Amount,
		&transaction.Recipient, &transaction.Status, &transaction.Reference, &transaction.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrTransactionNotFound
	}
	if err != nil {
		return nil, err
	}
	return &transaction, nil
}

// Execute debits the wallet and inserts a pending transaction row in one
// database transaction, calls Nomba, then finalizes the row. If Nomba
// declines or errors, the debit is compensated.
func (service *TransactionService) Execute(ctx context.Context, userID string, input ExecuteTransactionInput, requestInfo audit.RequestInfo) (*models.TransactionResponse, error) {
	if input.AmountKobo <= 0 {
		return nil, fmt.Errorf("amount must be greater than zero")
	}

	reference := uuid.NewString()

	transactionID, err := service.debitWalletAndRecordPending(ctx, userID, input, reference)
	if err != nil {
		return nil, err
	}

	executionResult, executionErr := service.executeViaNomba(ctx, input, reference)

	if executionErr != nil || !executionResult.Succeeded {
		failureReason := "payment provider error"
		if executionErr == nil {
			failureReason = executionResult.FailureReason
		}
		if refundErr := service.refundWalletAndMarkFailed(ctx, userID, transactionID, input.AmountKobo, failureReason); refundErr != nil {
			// The refund must not be lost: surface loudly for reconciliation.
			service.auditRecorder.Record(ctx, audit.Event{
				UserID: userID, EventType: "transaction.refund_failed",
				ResourceType: "transaction", ResourceID: transactionID,
				Metadata: map[string]interface{}{"error": refundErr.Error()},
			})
			return nil, fmt.Errorf("transaction failed and refund is pending reconciliation: %s", failureReason)
		}
		service.auditRecorder.Record(ctx, audit.Event{
			UserID: userID, EventType: "transaction.failed",
			ResourceType: "transaction", ResourceID: transactionID,
			IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
			Metadata: map[string]interface{}{"reason": failureReason, "amount_kobo": input.AmountKobo},
		})
		return nil, fmt.Errorf("%w: %s", ErrTransactionDeclined, failureReason)
	}

	completedAt := time.Now()
	_, err = service.dbPool.Exec(ctx,
		`UPDATE transactions SET status = 'completed', nomba_reference = $1, completed_at = $2, updated_at = NOW()
		 WHERE id = $3`,
		executionResult.NombaReference, completedAt, transactionID)
	if err != nil {
		return nil, err
	}

	service.auditRecorder.Record(ctx, audit.Event{
		UserID: userID, EventType: "transaction.executed",
		ResourceType: "transaction", ResourceID: transactionID,
		IPAddress: requestInfo.IPAddress, UserAgent: requestInfo.UserAgent,
		Metadata: map[string]interface{}{
			"type": input.Type, "amount_kobo": input.AmountKobo,
			"recipient": input.Recipient, "nomba_reference": executionResult.NombaReference,
		},
	})

	return &models.TransactionResponse{
		ID:        transactionID,
		Type:      input.Type,
		Amount:    input.AmountKobo,
		Recipient: input.Recipient,
		Status:    "completed",
		CreatedAt: completedAt,
		Reference: reference,
	}, nil
}

func (service *TransactionService) debitWalletAndRecordPending(ctx context.Context, userID string, input ExecuteTransactionInput, reference string) (string, error) {
	databaseTx, err := service.dbPool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer func() { _ = databaseTx.Rollback(ctx) }()

	// Conditional debit: only succeeds when the balance covers the amount,
	// so concurrent spends cannot overdraw the wallet.
	commandTag, err := databaseTx.Exec(ctx,
		`UPDATE wallets SET balance = balance - $1, updated_at = NOW()
		 WHERE user_id = $2 AND balance >= $1`,
		input.AmountKobo, userID)
	if err != nil {
		return "", err
	}
	if commandTag.RowsAffected() == 0 {
		return "", ErrInsufficientBalance
	}

	var transactionID string
	err = databaseTx.QueryRow(ctx,
		`INSERT INTO transactions (user_id, type, amount, recipient, description, status, reference)
		 VALUES ($1, $2, $3, $4, $5, 'pending', $6)
		 RETURNING id`,
		userID, input.Type, input.AmountKobo, input.Recipient, input.Description, reference,
	).Scan(&transactionID)
	if err != nil {
		return "", err
	}

	if err := databaseTx.Commit(ctx); err != nil {
		return "", err
	}
	return transactionID, nil
}

func (service *TransactionService) refundWalletAndMarkFailed(ctx context.Context, userID string, transactionID string, amountKobo int64, failureReason string) error {
	databaseTx, err := service.dbPool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = databaseTx.Rollback(ctx) }()

	if _, err := databaseTx.Exec(ctx,
		`UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
		amountKobo, userID); err != nil {
		return err
	}
	if _, err := databaseTx.Exec(ctx,
		`UPDATE transactions SET status = 'failed', error_message = $1, updated_at = NOW() WHERE id = $2`,
		failureReason, transactionID); err != nil {
		return err
	}
	return databaseTx.Commit(ctx)
}

func (service *TransactionService) executeViaNomba(ctx context.Context, input ExecuteTransactionInput, reference string) (nomba.ExecutionResult, error) {
	switch input.Type {
	case "transfer":
		return service.nombaClient.TransferMoney(ctx, nomba.TransferRequest{
			AmountKobo:    input.AmountKobo,
			BankCode:      input.BankCode,
			AccountNumber: input.AccountNumber,
			RecipientName: input.RecipientName,
			Narration:     input.Description,
			Reference:     reference,
		})
	case "airtime":
		return service.nombaClient.BuyAirtime(ctx, nomba.AirtimeRequest{
			AmountKobo:  input.AmountKobo,
			PhoneNumber: input.PhoneNumber,
			Network:     input.Network,
			Reference:   reference,
		})
	case "data":
		return service.nombaClient.BuyData(ctx, nomba.DataRequest{
			AmountKobo:  input.AmountKobo,
			PhoneNumber: input.PhoneNumber,
			Network:     input.Network,
			PlanCode:    input.PlanCode,
			Reference:   reference,
		})
	case "bill":
		return service.nombaClient.PayBill(ctx, nomba.BillPaymentRequest{
			AmountKobo: input.AmountKobo,
			BillerCode: input.BillerCode,
			CustomerID: input.CustomerID,
			Reference:  reference,
		})
	}
	return nomba.ExecutionResult{}, fmt.Errorf("unknown transaction type: %s", input.Type)
}
