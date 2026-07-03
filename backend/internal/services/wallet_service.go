package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrWalletNotFound = fmt.Errorf("wallet not found")

type WalletService struct {
	dbPool *pgxpool.Pool
}

type WalletBalance struct {
	BalanceKobo       int64  `json:"balance_kobo"`
	LedgerBalanceKobo int64  `json:"ledger_balance_kobo"`
	Currency          string `json:"currency"`
}

type LinkedAccount struct {
	ID            string `json:"id"`
	AccountNumber string `json:"account_number"`
	AccountName   string `json:"account_name"`
	BankName      string `json:"bank_name"`
	BankCode      string `json:"bank_code"`
	IsDefault     bool   `json:"is_default"`
}

type LinkAccountInput struct {
	AccountNumber string `json:"account_number" validate:"required,len=10"`
	AccountName   string `json:"account_name" validate:"required"`
	BankName      string `json:"bank_name" validate:"required"`
	BankCode      string `json:"bank_code" validate:"required"`
	IsDefault     bool   `json:"is_default"`
}

func NewWalletService(dbPool *pgxpool.Pool) *WalletService {
	return &WalletService{dbPool: dbPool}
}

func (service *WalletService) GetBalance(ctx context.Context, userID string) (*WalletBalance, error) {
	var balance WalletBalance
	err := service.dbPool.QueryRow(ctx,
		`SELECT balance, ledger_balance, currency FROM wallets WHERE user_id = $1`,
		userID,
	).Scan(&balance.BalanceKobo, &balance.LedgerBalanceKobo, &balance.Currency)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrWalletNotFound
	}
	if err != nil {
		return nil, err
	}
	return &balance, nil
}

func (service *WalletService) GetAccounts(ctx context.Context, userID string) ([]LinkedAccount, error) {
	rows, err := service.dbPool.Query(ctx,
		`SELECT id, account_number, COALESCE(account_name, ''), COALESCE(bank_name, ''), COALESCE(bank_code, ''), is_default
		 FROM accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_default DESC, created_at`,
		userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	linkedAccounts := []LinkedAccount{}
	for rows.Next() {
		var account LinkedAccount
		if err := rows.Scan(&account.ID, &account.AccountNumber, &account.AccountName,
			&account.BankName, &account.BankCode, &account.IsDefault); err != nil {
			return nil, err
		}
		linkedAccounts = append(linkedAccounts, account)
	}
	return linkedAccounts, rows.Err()
}

func (service *WalletService) LinkAccount(ctx context.Context, userID string, input LinkAccountInput) (*LinkedAccount, error) {
	var accountID string
	err := service.dbPool.QueryRow(ctx,
		`INSERT INTO accounts (user_id, account_number, account_name, bank_name, bank_code, is_default)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id`,
		userID, input.AccountNumber, input.AccountName, input.BankName, input.BankCode, input.IsDefault,
	).Scan(&accountID)
	if err != nil {
		return nil, err
	}
	return &LinkedAccount{
		ID:            accountID,
		AccountNumber: input.AccountNumber,
		AccountName:   input.AccountName,
		BankName:      input.BankName,
		BankCode:      input.BankCode,
		IsDefault:     input.IsDefault,
	}, nil
}
