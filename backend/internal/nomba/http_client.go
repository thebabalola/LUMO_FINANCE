package nomba

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// HTTPClient talks to the real Nomba API. Endpoint paths follow Nomba's
// v1 API; adjust when real credentials are available to verify against
// their sandbox.
type HTTPClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewHTTPClient(baseURL string, apiKey string) *HTTPClient {
	return &HTTPClient{
		baseURL:    baseURL,
		apiKey:     apiKey,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

type nombaAPIResponse struct {
	Code        string `json:"code"`
	Description string `json:"description"`
	Data        struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		// Account lookup fields
		AccountName string `json:"accountName"`
	} `json:"data"`
}

func (client *HTTPClient) postJSON(ctx context.Context, path string, payload map[string]interface{}) (*nombaAPIResponse, error) {
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, client.baseURL+path, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+client.apiKey)

	response, err := client.httpClient.Do(request)
	if err != nil {
		return nil, err
	}
	defer func() { _ = response.Body.Close() }()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode >= 500 {
		return nil, fmt.Errorf("nomba API error %d: %s", response.StatusCode, string(responseBody))
	}

	var apiResponse nombaAPIResponse
	if err := json.Unmarshal(responseBody, &apiResponse); err != nil {
		return nil, fmt.Errorf("nomba API returned unparseable response: %w", err)
	}
	return &apiResponse, nil
}

func executionResultFromResponse(apiResponse *nombaAPIResponse) ExecutionResult {
	succeeded := apiResponse.Code == "00" || apiResponse.Data.Status == "SUCCESS"
	result := ExecutionResult{
		Succeeded:      succeeded,
		NombaReference: apiResponse.Data.ID,
	}
	if !succeeded {
		result.FailureReason = apiResponse.Description
	}
	return result
}

func (client *HTTPClient) TransferMoney(ctx context.Context, request TransferRequest) (ExecutionResult, error) {
	apiResponse, err := client.postJSON(ctx, "/transfers/bank", map[string]interface{}{
		"amount":            request.AmountKobo,
		"accountNumber":     request.AccountNumber,
		"bankCode":          request.BankCode,
		"accountName":       request.RecipientName,
		"narration":         request.Narration,
		"merchantTxRef":     request.Reference,
		"senderName":        "Lumo Finance",
	})
	if err != nil {
		return ExecutionResult{}, err
	}
	return executionResultFromResponse(apiResponse), nil
}

func (client *HTTPClient) BuyAirtime(ctx context.Context, request AirtimeRequest) (ExecutionResult, error) {
	apiResponse, err := client.postJSON(ctx, "/bill/topup", map[string]interface{}{
		"amount":        request.AmountKobo,
		"phoneNumber":   request.PhoneNumber,
		"network":       request.Network,
		"merchantTxRef": request.Reference,
	})
	if err != nil {
		return ExecutionResult{}, err
	}
	return executionResultFromResponse(apiResponse), nil
}

func (client *HTTPClient) BuyData(ctx context.Context, request DataRequest) (ExecutionResult, error) {
	apiResponse, err := client.postJSON(ctx, "/bill/data", map[string]interface{}{
		"amount":        request.AmountKobo,
		"phoneNumber":   request.PhoneNumber,
		"network":       request.Network,
		"planCode":      request.PlanCode,
		"merchantTxRef": request.Reference,
	})
	if err != nil {
		return ExecutionResult{}, err
	}
	return executionResultFromResponse(apiResponse), nil
}

func (client *HTTPClient) PayBill(ctx context.Context, request BillPaymentRequest) (ExecutionResult, error) {
	apiResponse, err := client.postJSON(ctx, "/bill/pay", map[string]interface{}{
		"amount":        request.AmountKobo,
		"billerCode":    request.BillerCode,
		"customerId":    request.CustomerID,
		"merchantTxRef": request.Reference,
	})
	if err != nil {
		return ExecutionResult{}, err
	}
	return executionResultFromResponse(apiResponse), nil
}

func (client *HTTPClient) LookupBankAccount(ctx context.Context, bankCode string, accountNumber string) (AccountLookupResult, error) {
	apiResponse, err := client.postJSON(ctx, "/transfers/bank/lookup", map[string]interface{}{
		"accountNumber": accountNumber,
		"bankCode":      bankCode,
	})
	if err != nil {
		return AccountLookupResult{}, err
	}
	if apiResponse.Data.AccountName == "" {
		return AccountLookupResult{}, fmt.Errorf("account lookup failed: %s", apiResponse.Description)
	}
	return AccountLookupResult{
		AccountName:   apiResponse.Data.AccountName,
		AccountNumber: accountNumber,
		BankCode:      bankCode,
	}, nil
}
