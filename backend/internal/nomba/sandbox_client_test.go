package nomba

import (
	"context"
	"strings"
	"testing"
)

func TestSandboxTransferSucceedsUnderThreshold(t *testing.T) {
	client := NewSandboxClient()

	result, err := client.TransferMoney(context.Background(), TransferRequest{
		AmountKobo:    500_000, // ₦5,000
		BankCode:      "058",
		AccountNumber: "0123456789",
	})
	if err != nil {
		t.Fatalf("TransferMoney failed: %v", err)
	}
	if !result.Succeeded {
		t.Errorf("expected transfer to succeed, got failure: %s", result.FailureReason)
	}
	if !strings.HasPrefix(result.NombaReference, "SANDBOX-") {
		t.Errorf("expected a SANDBOX- reference, got %q", result.NombaReference)
	}
}

func TestSandboxDeclinesLargeAmounts(t *testing.T) {
	client := NewSandboxClient()

	result, err := client.TransferMoney(context.Background(), TransferRequest{
		AmountKobo:    sandboxDeclineThresholdKobo,
		BankCode:      "058",
		AccountNumber: "0123456789",
	})
	if err != nil {
		t.Fatalf("TransferMoney failed: %v", err)
	}
	if result.Succeeded {
		t.Error("expected amounts at the decline threshold to be declined")
	}
	if result.FailureReason == "" {
		t.Error("expected a failure reason on declined transactions")
	}
}

func TestSandboxAccountLookupIsDeterministic(t *testing.T) {
	client := NewSandboxClient()

	firstLookup, err := client.LookupBankAccount(context.Background(), "058", "0123456789")
	if err != nil {
		t.Fatalf("LookupBankAccount failed: %v", err)
	}
	secondLookup, err := client.LookupBankAccount(context.Background(), "058", "0123456789")
	if err != nil {
		t.Fatalf("LookupBankAccount failed: %v", err)
	}
	if firstLookup.AccountName != secondLookup.AccountName {
		t.Errorf("expected deterministic names, got %q then %q", firstLookup.AccountName, secondLookup.AccountName)
	}
	if firstLookup.AccountName == "" {
		t.Error("expected a non-empty account name")
	}
}

func TestSandboxAccountLookupRejectsBadAccountNumber(t *testing.T) {
	client := NewSandboxClient()
	if _, err := client.LookupBankAccount(context.Background(), "058", "12345"); err == nil {
		t.Error("expected lookup with a non-10-digit account number to fail")
	}
}
