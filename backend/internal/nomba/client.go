package nomba

import "context"

// Client is Lumo's payment execution interface. The sandbox implementation
// lets the whole product work with zero Nomba credentials; the HTTP
// implementation talks to the real Nomba API.
type Client interface {
	TransferMoney(ctx context.Context, request TransferRequest) (ExecutionResult, error)
	BuyAirtime(ctx context.Context, request AirtimeRequest) (ExecutionResult, error)
	BuyData(ctx context.Context, request DataRequest) (ExecutionResult, error)
	PayBill(ctx context.Context, request BillPaymentRequest) (ExecutionResult, error)
	LookupBankAccount(ctx context.Context, bankCode string, accountNumber string) (AccountLookupResult, error)
}

type TransferRequest struct {
	AmountKobo    int64
	BankCode      string
	AccountNumber string
	RecipientName string
	Narration     string
	Reference     string // our transaction reference, passed to Nomba for reconciliation
}

type AirtimeRequest struct {
	AmountKobo  int64
	PhoneNumber string
	Network     string // mtn, glo, airtel, 9mobile
	Reference   string
}

type DataRequest struct {
	AmountKobo  int64
	PhoneNumber string
	Network     string
	PlanCode    string
	Reference   string
}

type BillPaymentRequest struct {
	AmountKobo int64
	BillerCode string
	CustomerID string // meter number, smartcard number, etc.
	Reference  string
}

type ExecutionResult struct {
	Succeeded      bool
	NombaReference string
	FailureReason  string
}

type AccountLookupResult struct {
	AccountName   string
	AccountNumber string
	BankCode      string
}
