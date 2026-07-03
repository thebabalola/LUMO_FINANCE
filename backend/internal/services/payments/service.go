package payments

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/vatilize-labs/lumo-finance/internal/services/nomba"
)

type Service struct {
	db    *pgxpool.Pool
	nomba *nomba.Client
}

func NewService(db *pgxpool.Pool, nombaClient *nomba.Client) *Service {
	return &Service{db: db, nomba: nombaClient}
}

type APIResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data,omitempty"`
	Error   any  `json:"error,omitempty"`
}

type DraftRequest struct {
	Type          string `json:"type"`
	Amount        int64  `json:"amount"`
	AccountNumber string `json:"accountNumber"`
	BankCode      string `json:"bankCode"`
	Narration     string `json:"narration"`
	PhoneNumber   string `json:"phoneNumber"`
	Network       string `json:"network"`
	Disco         string `json:"disco"`
	CustomerID    string `json:"customerId"`
	MeterType     string `json:"meterType"`
	PayerName     string `json:"payerName"`
}

type ConfirmRequest struct {
	PIN string `json:"pin"`
}

type TransactionResponse struct {
	TransactionID      string         `json:"transactionId"`
	Type               string         `json:"type"`
	Status             string         `json:"status"`
	Amount             int64          `json:"amount"`
	Fee                int64          `json:"fee"`
	TotalDebit         int64          `json:"totalDebit"`
	Currency           string         `json:"currency"`
	MerchantTxRef      string         `json:"merchantTxRef,omitempty"`
	Provider           string         `json:"provider,omitempty"`
	ProviderReference  string         `json:"providerReference,omitempty"`
	SessionID          string         `json:"sessionId,omitempty"`
	Recipient          map[string]any `json:"recipient,omitempty"`
	PhoneNumber        string         `json:"phoneNumber,omitempty"`
	Network            string         `json:"network,omitempty"`
	BillProvider       string         `json:"billProvider,omitempty"`
	CustomerID         string         `json:"customerId,omitempty"`
	Receipt            map[string]any `json:"receipt,omitempty"`
	RequiresPIN        bool           `json:"requiresPin,omitempty"`
	PreviewText        string         `json:"previewText,omitempty"`
	CreatedAt          time.Time      `json:"createdAt"`
	ConfirmedAt        *time.Time     `json:"confirmedAt,omitempty"`
	ExecutedAt         *time.Time     `json:"executedAt,omitempty"`
	SettledAt          *time.Time     `json:"settledAt,omitempty"`
}

type transactionRecord struct {
	ID                     string
	UserID                 string
	Type                   string
	Status                 string
	Amount                 int64
	Fee                    int64
	TotalDebit             int64
	Currency               string
	MerchantTxRef          string
	Provider               string
	ProviderTransactionID  string
	ProviderSessionID      string
	RecipientAccountNumber string
	RecipientAccountName   string
	RecipientBankCode      string
	RecipientBankName      string
	PhoneNumber            string
	Network                string
	BillProvider           string
	CustomerID             string
	MeterType              string
	PayerName              string
	Narration              string
	ReceiptJSON            []byte
	CreatedAt              time.Time
	ConfirmedAt            *time.Time
	ExecutedAt             *time.Time
	SettledAt              *time.Time
}

func (s *Service) GetBanks(ctx context.Context) ([]nomba.Bank, error) {
	banks, _, err := s.nomba.GetBanks(ctx)
	if err != nil {
		return nil, err
	}
	for _, bank := range banks {
		_, _ = s.db.Exec(ctx, `
			INSERT INTO bank_cache (code, name, logo)
			VALUES ($1, $2, $3)
			ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, updated_at = CURRENT_TIMESTAMP
		`, bank.Code, bank.Name, bank.Logo)
	}
	return banks, nil
}

func (s *Service) VerifyRecipient(ctx context.Context, accountNumber string, bankCode string) (*nomba.VerifiedBankAccount, error) {
	returnedAccount, _, err := s.nomba.VerifyBankAccount(ctx, accountNumber, bankCode)
	return returnedAccount, err
}

func (s *Service) CreateDraft(ctx context.Context, userID string, request DraftRequest) (*TransactionResponse, error) {
	if request.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than zero")
	}

	transactionID := newID()
	merchantTxRef := "lumo_" + transactionID + "_" + shortRandom()
	transactionType := normalizeTransactionType(request.Type)
	if transactionType == "" {
		return nil, fmt.Errorf("unsupported transaction type")
	}

	record := transactionRecord{
		ID:            transactionID,
		UserID:        userID,
		Type:          transactionType,
		Status:        "pending_confirmation",
		Amount:        request.Amount,
		Fee:           0,
		TotalDebit:    request.Amount,
		Currency:      "NGN",
		MerchantTxRef: merchantTxRef,
		Provider:      "nomba",
		Narration:     request.Narration,
	}

	switch transactionType {
	case "bank_transfer":
		verifiedAccount, err := s.VerifyRecipient(ctx, request.AccountNumber, request.BankCode)
		if err != nil {
			return nil, err
		}
		record.RecipientAccountNumber = request.AccountNumber
		record.RecipientAccountName = verifiedAccount.AccountName
		record.RecipientBankCode = request.BankCode
		record.RecipientBankName = s.bankName(ctx, request.BankCode)
		if record.Narration == "" {
			record.Narration = "Lumo transfer"
		}
	case "airtime", "data":
		record.PhoneNumber = request.PhoneNumber
		record.Network = normalizeNetwork(request.Network)
		if record.PhoneNumber == "" || record.Network == "" {
			return nil, fmt.Errorf("phoneNumber and network are required")
		}
	case "electricity":
		if request.Disco == "" || request.CustomerID == "" || request.MeterType == "" {
			return nil, fmt.Errorf("disco, customerId, and meterType are required")
		}
		customer, _, err := s.nomba.LookupElectricityCustomer(ctx, nomba.ElectricityLookupRequest{
			Disco:      request.Disco,
			CustomerID: request.CustomerID,
			MeterType:  request.MeterType,
		})
		if err != nil {
			return nil, err
		}
		record.BillProvider = request.Disco
		record.CustomerID = request.CustomerID
		record.MeterType = request.MeterType
		record.PayerName = request.PayerName
		record.ReceiptJSON, _ = json.Marshal(map[string]any{"customer": customer})
	}

	if err := s.insertTransaction(ctx, record); err != nil {
		return nil, err
	}

	created, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	return created.toResponse(), nil
}

func (s *Service) ConfirmTransaction(ctx context.Context, userID string, transactionID string, pin string) (*TransactionResponse, error) {
	if len(pin) < 4 {
		return nil, fmt.Errorf("pin is required")
	}

	record, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	if record.Status != "pending_confirmation" {
		return nil, fmt.Errorf("transaction cannot be confirmed from status %s", record.Status)
	}

	_, err = s.db.Exec(ctx, `
		UPDATE transactions
		SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND user_id = $2
	`, transactionID, userID)
	if err != nil {
		return nil, err
	}
	_ = s.insertStatusHistory(ctx, transactionID, record.Status, "confirmed", "user_confirmation", "User confirmed transaction", nil)

	updated, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	return updated.toResponse(), nil
}

func (s *Service) ExecuteTransaction(ctx context.Context, userID string, transactionID string) (*TransactionResponse, error) {
	record, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	if record.Status == "processing" || record.Status == "success" {
		return nil, fmt.Errorf("transaction has already been executed")
	}
	if record.Status != "confirmed" {
		return nil, fmt.Errorf("transaction must be confirmed before execution")
	}

	_, err = s.db.Exec(ctx, `
		UPDATE transactions
		SET status = 'processing', executed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND user_id = $2
	`, transactionID, userID)
	if err != nil {
		return nil, err
	}
	_ = s.insertStatusHistory(ctx, transactionID, record.Status, "processing", "provider_execution", "Provider execution started", nil)

	providerTransaction, err := s.executeProviderTransaction(ctx, record)
	if providerTransaction != nil && providerTransaction.Log != nil {
		_ = s.insertProviderLog(ctx, transactionID, providerTransaction.Log)
	}
	if err != nil {
		_, _ = s.db.Exec(ctx, `
			UPDATE transactions
			SET status = 'failed', error_message = $1, updated_at = CURRENT_TIMESTAMP
			WHERE id = $2
		`, err.Error(), transactionID)
		_ = s.insertStatusHistory(ctx, transactionID, "processing", "failed", "provider_error", err.Error(), nil)
		return nil, err
	}

	nextStatus := mapProviderStatus(providerTransaction.Status)
	receiptBytes, _ := json.Marshal(providerTransaction.Receipt)
	settledAtSQL := "NULL"
	if nextStatus == "success" {
		settledAtSQL = "CURRENT_TIMESTAMP"
	}
	_, err = s.db.Exec(ctx, fmt.Sprintf(`
		UPDATE transactions
		SET status = $1, fee = $2, total_debit = amount + $2, nomba_reference = $3,
			provider_transaction_id = $3, provider_session_id = $4, receipt_json = COALESCE(NULLIF($5, ''), '{}')::jsonb,
			settled_at = %s, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6 AND user_id = $7
	`, settledAtSQL),
		nextStatus,
		providerTransaction.Fee,
		providerTransaction.ProviderTransactionID,
		providerTransaction.ProviderSessionID,
		jsonString(receiptBytes),
		transactionID,
		userID,
	)
	if err != nil {
		return nil, err
	}
	_ = s.insertStatusHistory(ctx, transactionID, "processing", nextStatus, "provider_response", "Provider returned "+providerTransaction.Status, providerTransaction.Receipt)

	updated, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	return updated.toResponse(), nil
}

func (s *Service) ListTransactions(ctx context.Context, userID string) ([]*TransactionResponse, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, type, status, amount, fee, total_debit, currency, merchant_tx_ref, provider,
			COALESCE(provider_transaction_id, ''), COALESCE(provider_session_id, ''),
			COALESCE(recipient_account_number, ''), COALESCE(recipient_account_name, ''), COALESCE(recipient_bank_code, ''), COALESCE(recipient_bank_name, ''),
			COALESCE(phone_number, ''), COALESCE(network, ''), COALESCE(bill_provider, ''), COALESCE(customer_id, ''), COALESCE(meter_type, ''),
			COALESCE(payer_name, ''), COALESCE(narration, ''), COALESCE(receipt_json, '{}'::jsonb), created_at, confirmed_at, executed_at, settled_at
		FROM transactions
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	transactions := []*TransactionResponse{}
	for rows.Next() {
		record, err := scanTransaction(rows)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, record.toResponse())
	}
	return transactions, rows.Err()
}

func (s *Service) GetTransaction(ctx context.Context, userID string, transactionID string) (*TransactionResponse, error) {
	record, err := s.getTransactionRecord(ctx, userID, transactionID)
	if err != nil {
		return nil, err
	}
	return record.toResponse(), nil
}

func (s *Service) FetchDataPlans(ctx context.Context, network string) ([]nomba.DataPlan, error) {
	plans, _, err := s.nomba.FetchDataPlans(ctx, normalizeNetwork(network))
	return plans, err
}

func (s *Service) FetchElectricityProviders(ctx context.Context) ([]nomba.ElectricityProvider, error) {
	providers, _, err := s.nomba.FetchElectricityProviders(ctx)
	return providers, err
}

func (s *Service) HandleWebhook(ctx context.Context, headers map[string]string, payload map[string]any) error {
	eventType := stringFromMap(payload, "event_type", "eventType")
	requestID := stringFromMap(payload, "requestId", "request_id")
	if requestID == "" {
		requestID = newID()
	}
	payloadBytes, _ := json.Marshal(payload)
	headersBytes, _ := json.Marshal(headers)

	transactionData := nestedMap(payload, "data", "transaction")
	merchantTxRef := stringFromAny(transactionData["merchantTxRef"])
	providerTransactionID := stringFromAny(transactionData["transactionId"])
	providerSessionID := stringFromAny(transactionData["sessionId"])

	var transactionID string
	_ = s.db.QueryRow(ctx, `
		SELECT id FROM transactions
		WHERE merchant_tx_ref = $1 OR provider_transaction_id = $2 OR provider_session_id = $3
		ORDER BY created_at DESC
		LIMIT 1
	`, merchantTxRef, providerTransactionID, providerSessionID).Scan(&transactionID)

	_, err := s.db.Exec(ctx, `
		INSERT INTO provider_webhook_events (id, provider, event_type, request_id, signature_valid, matched_transaction_id, raw_headers, raw_payload, processed_at)
		VALUES ($1, 'nomba', $2, $3, false, NULLIF($4, ''), COALESCE(NULLIF($5, ''), '{}')::jsonb, COALESCE(NULLIF($6, ''), '{}')::jsonb, CURRENT_TIMESTAMP)
		ON CONFLICT (provider, request_id) DO UPDATE SET processed_at = CURRENT_TIMESTAMP
	`, newID(), eventType, requestID, transactionID, jsonString(headersBytes), jsonString(payloadBytes))
	if err != nil {
		return err
	}

	nextStatus := webhookStatus(eventType)
	if transactionID != "" && nextStatus != "" {
		var previousStatus string
		_ = s.db.QueryRow(ctx, `SELECT status FROM transactions WHERE id = $1`, transactionID).Scan(&previousStatus)
		_, err = s.db.Exec(ctx, `
			UPDATE transactions
			SET status = $1, provider_transaction_id = COALESCE(NULLIF($2, ''), provider_transaction_id),
				provider_session_id = COALESCE(NULLIF($3, ''), provider_session_id),
				settled_at = CASE WHEN $1 = 'success' THEN CURRENT_TIMESTAMP ELSE settled_at END,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = $4
		`, nextStatus, providerTransactionID, providerSessionID, transactionID)
		if err != nil {
			return err
		}
		_ = s.insertStatusHistory(ctx, transactionID, previousStatus, nextStatus, "nomba_webhook", "Webhook "+eventType, payload)
	}

	return nil
}

func (s *Service) executeProviderTransaction(ctx context.Context, record *transactionRecord) (*nomba.ProviderTransaction, error) {
	switch record.Type {
	case "bank_transfer":
		return s.nomba.TransferToBank(ctx, nomba.BankTransferRequest{
			Amount:        record.Amount,
			AccountNumber: record.RecipientAccountNumber,
			AccountName:   record.RecipientAccountName,
			BankCode:      record.RecipientBankCode,
			MerchantTxRef: record.MerchantTxRef,
			SenderName:    "Lumo Finance",
			Narration:     record.Narration,
		})
	case "airtime":
		return s.nomba.BuyAirtime(ctx, nomba.AirtimeRequest{
			Amount:        record.Amount,
			PhoneNumber:   record.PhoneNumber,
			Network:       record.Network,
			MerchantTxRef: record.MerchantTxRef,
			SenderName:    "Lumo Finance",
		})
	case "data":
		return s.nomba.BuyData(ctx, nomba.AirtimeRequest{
			Amount:        record.Amount,
			PhoneNumber:   record.PhoneNumber,
			Network:       record.Network,
			MerchantTxRef: record.MerchantTxRef,
			SenderName:    "Lumo Finance",
		})
	case "electricity":
		return s.nomba.PayElectricity(ctx, nomba.ElectricityPaymentRequest{
			Amount:        record.Amount,
			Disco:         record.BillProvider,
			CustomerID:    record.CustomerID,
			MeterType:     record.MeterType,
			PayerName:     record.PayerName,
			MerchantTxRef: record.MerchantTxRef,
		})
	default:
		return nil, fmt.Errorf("unsupported transaction type %s", record.Type)
	}
}

func (s *Service) insertTransaction(ctx context.Context, record transactionRecord) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO transactions (
			id, user_id, type, status, amount, fee, total_debit, currency, merchant_tx_ref, provider,
			recipient_account_number, recipient_account_name, recipient_bank_code, recipient_bank_name,
			phone_number, network, bill_provider, customer_id, meter_type, payer_name, narration, receipt_json
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, COALESCE(NULLIF($22, ''), '{}')::jsonb)
	`, record.ID, record.UserID, record.Type, record.Status, record.Amount, record.Fee, record.TotalDebit, record.Currency, record.MerchantTxRef, record.Provider,
		record.RecipientAccountNumber, record.RecipientAccountName, record.RecipientBankCode, record.RecipientBankName,
		record.PhoneNumber, record.Network, record.BillProvider, record.CustomerID, record.MeterType, record.PayerName, record.Narration, jsonString(record.ReceiptJSON))
	if err != nil {
		return err
	}
	return s.insertStatusHistory(ctx, record.ID, "", record.Status, "draft", "Transaction draft created", nil)
}

func (s *Service) getTransactionRecord(ctx context.Context, userID string, transactionID string) (*transactionRecord, error) {
	row := s.db.QueryRow(ctx, `
		SELECT id, user_id, type, status, amount, fee, total_debit, currency, merchant_tx_ref, provider,
			COALESCE(provider_transaction_id, ''), COALESCE(provider_session_id, ''),
			COALESCE(recipient_account_number, ''), COALESCE(recipient_account_name, ''), COALESCE(recipient_bank_code, ''), COALESCE(recipient_bank_name, ''),
			COALESCE(phone_number, ''), COALESCE(network, ''), COALESCE(bill_provider, ''), COALESCE(customer_id, ''), COALESCE(meter_type, ''),
			COALESCE(payer_name, ''), COALESCE(narration, ''), COALESCE(receipt_json, '{}'::jsonb), created_at, confirmed_at, executed_at, settled_at
		FROM transactions
		WHERE id = $1 AND user_id = $2
	`, transactionID, userID)
	return scanTransaction(row)
}

func scanTransaction(row pgx.Row) (*transactionRecord, error) {
	record := &transactionRecord{}
	var confirmedAt sql.NullTime
	var executedAt sql.NullTime
	var settledAt sql.NullTime
	err := row.Scan(
		&record.ID, &record.UserID, &record.Type, &record.Status, &record.Amount, &record.Fee, &record.TotalDebit, &record.Currency,
		&record.MerchantTxRef, &record.Provider, &record.ProviderTransactionID, &record.ProviderSessionID,
		&record.RecipientAccountNumber, &record.RecipientAccountName, &record.RecipientBankCode, &record.RecipientBankName,
		&record.PhoneNumber, &record.Network, &record.BillProvider, &record.CustomerID, &record.MeterType,
		&record.PayerName, &record.Narration, &record.ReceiptJSON, &record.CreatedAt, &confirmedAt, &executedAt, &settledAt,
	)
	if confirmedAt.Valid {
		record.ConfirmedAt = &confirmedAt.Time
	}
	if executedAt.Valid {
		record.ExecutedAt = &executedAt.Time
	}
	if settledAt.Valid {
		record.SettledAt = &settledAt.Time
	}
	return record, err
}

func (s *Service) insertStatusHistory(ctx context.Context, transactionID string, fromStatus string, toStatus string, source string, reason string, metadata any) error {
	metadataBytes, _ := json.Marshal(metadata)
	_, err := s.db.Exec(ctx, `
		INSERT INTO transaction_status_history (id, transaction_id, from_status, to_status, source, reason, metadata)
		VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6, COALESCE(NULLIF($7, ''), '{}')::jsonb)
	`, newID(), transactionID, fromStatus, toStatus, source, reason, jsonString(metadataBytes))
	return err
}

func (s *Service) insertProviderLog(ctx context.Context, transactionID string, providerLog *nomba.ProviderResponseLog) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO provider_request_logs (id, transaction_id, provider, method, path, request_body, response_body, response_code, http_status, duration_ms)
		VALUES ($1, $2, 'nomba', $3, $4, COALESCE(NULLIF($5, ''), '{}')::jsonb, COALESCE(NULLIF($6, ''), '{}')::jsonb, $7, $8, $9)
	`, newID(), transactionID, providerLog.Method, providerLog.Path, jsonString(providerLog.RequestBody), jsonString(providerLog.ResponseBody), providerLog.ResponseCode, providerLog.HTTPStatus, providerLog.DurationMS)
	return err
}

func (s *Service) bankName(ctx context.Context, bankCode string) string {
	var bankName string
	_ = s.db.QueryRow(ctx, `SELECT name FROM bank_cache WHERE code = $1`, bankCode).Scan(&bankName)
	return bankName
}

func (record *transactionRecord) toResponse() *TransactionResponse {
	receipt := map[string]any{}
	if len(record.ReceiptJSON) > 0 {
		_ = json.Unmarshal(record.ReceiptJSON, &receipt)
	}
	response := &TransactionResponse{
		TransactionID:     record.ID,
		Type:              record.Type,
		Status:            record.Status,
		Amount:            record.Amount,
		Fee:               record.Fee,
		TotalDebit:        record.TotalDebit,
		Currency:          record.Currency,
		MerchantTxRef:     record.MerchantTxRef,
		Provider:          record.Provider,
		ProviderReference: record.ProviderTransactionID,
		SessionID:         record.ProviderSessionID,
		PhoneNumber:       record.PhoneNumber,
		Network:           record.Network,
		BillProvider:      record.BillProvider,
		CustomerID:        record.CustomerID,
		Receipt:           receipt,
		RequiresPIN:       record.Status == "pending_confirmation",
		PreviewText:       record.previewText(),
		CreatedAt:         record.CreatedAt,
		ConfirmedAt:       record.ConfirmedAt,
		ExecutedAt:        record.ExecutedAt,
		SettledAt:         record.SettledAt,
	}
	if record.RecipientAccountNumber != "" {
		response.Recipient = map[string]any{
			"accountNumber": record.RecipientAccountNumber,
			"accountName":   record.RecipientAccountName,
			"bankCode":      record.RecipientBankCode,
			"bankName":      record.RecipientBankName,
		}
	}
	return response
}

func (record *transactionRecord) previewText() string {
	switch record.Type {
	case "bank_transfer":
		return fmt.Sprintf("Send NGN %d to %s", record.Amount, record.RecipientAccountName)
	case "airtime":
		return fmt.Sprintf("Buy NGN %d %s airtime for %s", record.Amount, record.Network, record.PhoneNumber)
	case "data":
		return fmt.Sprintf("Buy NGN %d %s data for %s", record.Amount, record.Network, record.PhoneNumber)
	case "electricity":
		return fmt.Sprintf("Pay NGN %d electricity for %s", record.Amount, record.CustomerID)
	default:
		return ""
	}
}

func normalizeTransactionType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "bank_transfer", "transfer":
		return "bank_transfer"
	case "airtime":
		return "airtime"
	case "data":
		return "data"
	case "electricity", "bill":
		return "electricity"
	default:
		return ""
	}
}

func normalizeNetwork(value string) string {
	normalized := strings.ToUpper(strings.TrimSpace(value))
	normalized = strings.ReplaceAll(normalized, "9 MOBILE", "9MOBILE")
	switch normalized {
	case "MTN", "AIRTEL", "GLO", "9MOBILE":
		return normalized
	default:
		return ""
	}
}

func mapProviderStatus(value string) string {
	switch strings.ToUpper(value) {
	case "SUCCESS":
		return "success"
	case "REFUND", "REFUNDED":
		return "refunded"
	case "FAILED", "PAYMENT_FAILED", "PAYOUT_FAILED":
		return "failed"
	default:
		return "processing"
	}
}

func webhookStatus(eventType string) string {
	switch strings.ToLower(eventType) {
	case "payment_success", "payout_success":
		return "success"
	case "payment_failed", "payout_failed":
		return "failed"
	case "payout_refund":
		return "refunded"
	case "payment_reversal":
		return "reversed"
	default:
		return ""
	}
}

func stringFromMap(source map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := source[key]; ok {
			return stringFromAny(value)
		}
	}
	return ""
}

func nestedMap(source map[string]any, keys ...string) map[string]any {
	current := source
	for _, key := range keys {
		next, _ := current[key].(map[string]any)
		if next == nil {
			return map[string]any{}
		}
		current = next
	}
	return current
}

func stringFromAny(value any) string {
	switch typedValue := value.(type) {
	case string:
		return typedValue
	default:
		return fmt.Sprint(typedValue)
	}
}

func newID() string {
	randomBytes := make([]byte, 16)
	if _, err := rand.Read(randomBytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(randomBytes)
}

func shortRandom() string {
	randomBytes := make([]byte, 4)
	if _, err := rand.Read(randomBytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(randomBytes)
}

func jsonString(value []byte) string {
	if len(value) == 0 {
		return "{}"
	}
	return string(value)
}
