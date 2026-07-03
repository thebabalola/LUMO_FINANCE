package nomba

import (
	"context"
	"fmt"
	"hash/fnv"

	"github.com/google/uuid"
)

// Amounts at or above this decline in the sandbox so the failure path is
// demoable without real credentials (₦1,000,000 in kobo).
const sandboxDeclineThresholdKobo int64 = 100_000_000

// SandboxClient is a deterministic, no-network Nomba stand-in. Every
// operation succeeds (below the decline threshold) and account lookups
// return stable fake names, so demos and tests need no credentials.
type SandboxClient struct{}

func NewSandboxClient() *SandboxClient {
	return &SandboxClient{}
}

var sandboxAccountNames = []string{
	"DAVID OKAFOR",
	"AMINA BELLO",
	"CHIOMA EZE",
	"TUNDE ADEYEMI",
	"NGOZI OKONKWO",
	"IBRAHIM MUSA",
	"FUNKE ADESANYA",
	"EMEKA NWOSU",
}

func sandboxResult(amountKobo int64) (ExecutionResult, error) {
	if amountKobo >= sandboxDeclineThresholdKobo {
		return ExecutionResult{
			Succeeded:     false,
			FailureReason: "sandbox: amounts of ₦1,000,000 or more are declined for testing",
		}, nil
	}
	return ExecutionResult{
		Succeeded:      true,
		NombaReference: "SANDBOX-" + uuid.NewString(),
	}, nil
}

func (client *SandboxClient) TransferMoney(ctx context.Context, request TransferRequest) (ExecutionResult, error) {
	return sandboxResult(request.AmountKobo)
}

func (client *SandboxClient) BuyAirtime(ctx context.Context, request AirtimeRequest) (ExecutionResult, error) {
	return sandboxResult(request.AmountKobo)
}

func (client *SandboxClient) BuyData(ctx context.Context, request DataRequest) (ExecutionResult, error) {
	return sandboxResult(request.AmountKobo)
}

func (client *SandboxClient) PayBill(ctx context.Context, request BillPaymentRequest) (ExecutionResult, error) {
	return sandboxResult(request.AmountKobo)
}

func (client *SandboxClient) LookupBankAccount(ctx context.Context, bankCode string, accountNumber string) (AccountLookupResult, error) {
	if len(accountNumber) != 10 {
		return AccountLookupResult{}, fmt.Errorf("account number must be 10 digits")
	}
	// Deterministic name selection so the same account number always
	// resolves to the same fake person.
	nameHash := fnv.New32a()
	nameHash.Write([]byte(bankCode + accountNumber))
	accountName := sandboxAccountNames[nameHash.Sum32()%uint32(len(sandboxAccountNames))]

	return AccountLookupResult{
		AccountName:   accountName,
		AccountNumber: accountNumber,
		BankCode:      bankCode,
	}, nil
}
