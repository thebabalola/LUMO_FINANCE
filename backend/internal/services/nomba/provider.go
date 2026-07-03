package nomba

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
)

type Bank struct {
	Name string `json:"name"`
	Code string `json:"code"`
	Logo string `json:"logo"`
}

type VerifiedBankAccount struct {
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
	BankCode      string `json:"bankCode"`
}

type ProviderTransaction struct {
	ProviderTransactionID string         `json:"providerTransactionId"`
	ProviderSessionID     string         `json:"providerSessionId"`
	Status                string         `json:"status"`
	Fee                   int64          `json:"fee"`
	Receipt               map[string]any `json:"receipt"`
	Log                   *ProviderResponseLog
}

type DataPlan struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Amount int64  `json:"amount,omitempty"`
	Raw    any    `json:"raw,omitempty"`
}

type ElectricityProvider struct {
	Name string `json:"name"`
	Code string `json:"code"`
	Raw  any    `json:"raw,omitempty"`
}

type BillCustomer struct {
	CustomerID string `json:"customerId"`
	Name       string `json:"name,omitempty"`
	Address    string `json:"address,omitempty"`
	Raw        any    `json:"raw,omitempty"`
}

func (c *Client) GetBanks(ctx context.Context) ([]Bank, *ProviderResponseLog, error) {
	var banks []Bank
	log, err := c.Request(ctx, http.MethodGet, "/v1/transfers/banks", nil, &banks)
	return banks, log, err
}

func (c *Client) VerifyBankAccount(ctx context.Context, accountNumber string, bankCode string) (*VerifiedBankAccount, *ProviderResponseLog, error) {
	requestBody := map[string]string{
		"accountNumber": accountNumber,
		"bankCode":      bankCode,
	}
	var response VerifiedBankAccount
	log, err := c.Request(ctx, http.MethodPost, "/v1/transfers/bank/lookup", requestBody, &response)
	response.BankCode = bankCode
	return &response, log, err
}

func (c *Client) TransferToBank(ctx context.Context, request BankTransferRequest) (*ProviderTransaction, error) {
	var response map[string]any
	log, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/v2/transfers/bank/%s", c.config.SubAccountID), request, &response)
	return transactionFromResponse(response, log), err
}

func (c *Client) BuyAirtime(ctx context.Context, request AirtimeRequest) (*ProviderTransaction, error) {
	var response map[string]any
	log, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/v1/bill/topup/%s", c.config.SubAccountID), request, &response)
	return transactionFromResponse(response, log), err
}

func (c *Client) FetchDataPlans(ctx context.Context, network string) ([]DataPlan, *ProviderResponseLog, error) {
	var response []map[string]any
	log, err := c.Request(ctx, http.MethodGet, "/v1/bill/data-plan/"+url.PathEscape(network), nil, &response)
	plans := make([]DataPlan, 0, len(response))
	for index, plan := range response {
		plans = append(plans, DataPlan{
			ID:     stringFromAny(first(plan, "id", "planId", "code"), fmt.Sprintf("%s_%d", network, index)),
			Name:   stringFromAny(first(plan, "name", "planName", "description"), fmt.Sprintf("%s data plan", network)),
			Amount: int64FromAny(first(plan, "amount", "price")),
			Raw:    plan,
		})
	}
	return plans, log, err
}

func (c *Client) BuyData(ctx context.Context, request AirtimeRequest) (*ProviderTransaction, error) {
	var response map[string]any
	log, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/v1/bill/data/%s", c.config.SubAccountID), request, &response)
	return transactionFromResponse(response, log), err
}

func (c *Client) FetchElectricityProviders(ctx context.Context) ([]ElectricityProvider, *ProviderResponseLog, error) {
	var response []map[string]any
	log, err := c.Request(ctx, http.MethodGet, "/v1/bill/electricity/discos", nil, &response)
	providers := make([]ElectricityProvider, 0, len(response))
	for _, provider := range response {
		providers = append(providers, ElectricityProvider{
			Name: stringFromAny(first(provider, "name", "discoName", "description"), ""),
			Code: stringFromAny(first(provider, "code", "disco", "id"), ""),
			Raw:  provider,
		})
	}
	return providers, log, err
}

func (c *Client) LookupElectricityCustomer(ctx context.Context, request ElectricityLookupRequest) (*BillCustomer, *ProviderResponseLog, error) {
	query := url.Values{}
	query.Set("disco", request.Disco)
	query.Set("customerId", request.CustomerID)
	query.Set("meterType", request.MeterType)

	var response map[string]any
	log, err := c.Request(ctx, http.MethodGet, "/v1/bill/electricity/lookup?"+query.Encode(), nil, &response)
	customer := &BillCustomer{
		CustomerID: request.CustomerID,
		Name:       stringFromAny(first(response, "name", "customerName", "meterName"), ""),
		Address:    stringFromAny(first(response, "address", "customerAddress"), ""),
		Raw:        response,
	}
	return customer, log, err
}

func (c *Client) PayElectricity(ctx context.Context, request ElectricityPaymentRequest) (*ProviderTransaction, error) {
	var response map[string]any
	log, err := c.Request(ctx, http.MethodPost, fmt.Sprintf("/v1/bill/electricity/%s", c.config.SubAccountID), request, &response)
	return transactionFromResponse(response, log), err
}

type BankTransferRequest struct {
	Amount        int64  `json:"amount"`
	AccountNumber string `json:"accountNumber"`
	AccountName   string `json:"accountName"`
	BankCode      string `json:"bankCode"`
	MerchantTxRef string `json:"merchantTxRef"`
	SenderName    string `json:"senderName,omitempty"`
	Narration     string `json:"narration,omitempty"`
}

type AirtimeRequest struct {
	Amount        int64  `json:"amount"`
	PhoneNumber   string `json:"phoneNumber"`
	Network       string `json:"network"`
	MerchantTxRef string `json:"merchantTxRef"`
	SenderName    string `json:"senderName,omitempty"`
}

type ElectricityLookupRequest struct {
	Disco      string `json:"disco"`
	CustomerID string `json:"customerId"`
	MeterType  string `json:"meterType"`
}

type ElectricityPaymentRequest struct {
	Disco         string `json:"disco"`
	MerchantTxRef string `json:"merchantTxRef"`
	PayerName     string `json:"payerName"`
	Amount        int64  `json:"amount"`
	CustomerID    string `json:"customerId"`
	MeterType     string `json:"meterType"`
}

func transactionFromResponse(response map[string]any, log *ProviderResponseLog) *ProviderTransaction {
	meta, _ := response["meta"].(map[string]any)
	receipt := map[string]any{}
	for key, value := range response {
		receipt[key] = value
	}
	return &ProviderTransaction{
		ProviderTransactionID: stringFromAny(first(response, "id", "transactionId"), stringFromAny(first(meta, "transactionId"), "")),
		ProviderSessionID:     stringFromAny(first(response, "sessionId"), stringFromAny(first(meta, "sessionId"), "")),
		Status:                stringFromAny(first(response, "status"), "PROCESSING"),
		Fee:                   int64FromAny(first(response, "fee")),
		Receipt:               receipt,
		Log:                   log,
	}
}

func first(source map[string]any, keys ...string) any {
	if source == nil {
		return nil
	}
	for _, key := range keys {
		if value, ok := source[key]; ok {
			return value
		}
	}
	return nil
}

func stringFromAny(value any, fallback string) string {
	switch typedValue := value.(type) {
	case string:
		if typedValue != "" {
			return typedValue
		}
	case fmt.Stringer:
		return typedValue.String()
	}
	return fallback
}

func int64FromAny(value any) int64 {
	switch typedValue := value.(type) {
	case int:
		return int64(typedValue)
	case int64:
		return typedValue
	case float64:
		return int64(typedValue)
	case string:
		var parsed int64
		_, _ = fmt.Sscan(typedValue, &parsed)
		return parsed
	}
	return 0
}
