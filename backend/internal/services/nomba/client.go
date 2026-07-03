package nomba

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type Config struct {
	BaseURL         string
	ParentAccountID string
	SubAccountID    string
	ClientID        string
	ClientSecret    string
	WebhookSecret   string
}

type Client struct {
	config     Config
	httpClient *http.Client
	tokenMu    sync.Mutex
	token      *tokenState
}

type tokenState struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

type envelope[T any] struct {
	Code            string `json:"code"`
	Description     string `json:"description"`
	Message         string `json:"message"`
	Status          bool   `json:"status"`
	ResponseCode    string `json:"responseCode"`
	ResponseMessage string `json:"responseMessage"`
	Data            T      `json:"data"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    string `json:"expiresAt"`
}

func NewFromEnv() *Client {
	baseURL := os.Getenv("NOMBA_BASE_URL")
	if baseURL == "" {
		baseURL = "https://sandbox.nomba.com"
	}

	return &Client{
		config: Config{
			BaseURL:         strings.TrimRight(baseURL, "/"),
			ParentAccountID: os.Getenv("NOMBA_PARENT_ACCOUNT_ID"),
			SubAccountID:    os.Getenv("NOMBA_SUB_ACCOUNT_ID"),
			ClientID:        os.Getenv("NOMBA_CLIENT_ID"),
			ClientSecret:    os.Getenv("NOMBA_CLIENT_SECRET"),
			WebhookSecret:   os.Getenv("NOMBA_WEBHOOK_SECRET"),
		},
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Config() Config {
	return c.config
}

func (c *Client) Request(ctx context.Context, method string, path string, requestBody any, responseData any) (*ProviderResponseLog, error) {
	accessToken, err := c.accessToken(ctx)
	if err != nil {
		return nil, err
	}

	requestBytes, err := json.Marshal(requestBody)
	if requestBody == nil {
		requestBytes = nil
	} else if err != nil {
		return nil, fmt.Errorf("marshal nomba request: %w", err)
	}

	startedAt := time.Now()
	httpRequest, err := http.NewRequestWithContext(ctx, method, c.config.BaseURL+path, bytes.NewReader(requestBytes))
	if err != nil {
		return nil, err
	}
	httpRequest.Header.Set("Authorization", "Bearer "+accessToken)
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("accountId", c.config.ParentAccountID)

	httpResponse, err := c.httpClient.Do(httpRequest)
	if err != nil {
		return nil, err
	}
	defer httpResponse.Body.Close()

	var raw json.RawMessage
	responseEnvelope := envelope[json.RawMessage]{Data: raw}
	if err := json.NewDecoder(httpResponse.Body).Decode(&responseEnvelope); err != nil {
		return nil, fmt.Errorf("decode nomba response: %w", err)
	}

	responseCode := responseEnvelope.Code
	if responseCode == "" {
		responseCode = responseEnvelope.ResponseCode
	}
	if responseCode == "" && httpResponse.StatusCode >= 200 && httpResponse.StatusCode < 300 {
		responseCode = "00"
	}

	log := &ProviderResponseLog{
		Method:       method,
		Path:         path,
		RequestBody:  requestBytes,
		ResponseBody: responseEnvelope.Data,
		ResponseCode: responseCode,
		HTTPStatus:   httpResponse.StatusCode,
		DurationMS:   int(time.Since(startedAt).Milliseconds()),
	}

	if httpResponse.StatusCode == http.StatusUnauthorized {
		c.clearToken()
		return log, fmt.Errorf("nomba unauthorized")
	}
	if httpResponse.StatusCode < 200 || httpResponse.StatusCode >= 300 {
		return log, fmt.Errorf("nomba http %d: %s", httpResponse.StatusCode, responseEnvelope.Description)
	}
	if responseCode != "00" {
		description := responseEnvelope.Description
		if description == "" {
			description = responseEnvelope.ResponseMessage
		}
		return log, fmt.Errorf("nomba code %s: %s", responseCode, description)
	}
	if responseData != nil && len(responseEnvelope.Data) > 0 {
		if err := json.Unmarshal(responseEnvelope.Data, responseData); err != nil {
			return log, fmt.Errorf("decode nomba data: %w", err)
		}
	}

	return log, nil
}

func (c *Client) accessToken(ctx context.Context) (string, error) {
	c.tokenMu.Lock()
	defer c.tokenMu.Unlock()

	if c.token != nil && time.Now().Before(c.token.ExpiresAt.Add(-5*time.Minute)) {
		return c.token.AccessToken, nil
	}

	if c.config.ParentAccountID == "" || c.config.ClientID == "" || c.config.ClientSecret == "" {
		return "", fmt.Errorf("missing nomba credentials")
	}

	requestBody := map[string]string{
		"grant_type":    "client_credentials",
		"client_id":     c.config.ClientID,
		"client_secret": c.config.ClientSecret,
	}
	requestBytes, _ := json.Marshal(requestBody)
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, c.config.BaseURL+"/v1/auth/token/issue", bytes.NewReader(requestBytes))
	if err != nil {
		return "", err
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("accountId", c.config.ParentAccountID)

	httpResponse, err := c.httpClient.Do(httpRequest)
	if err != nil {
		return "", err
	}
	defer httpResponse.Body.Close()

	var responseEnvelope envelope[tokenResponse]
	if err := json.NewDecoder(httpResponse.Body).Decode(&responseEnvelope); err != nil {
		return "", err
	}
	if httpResponse.StatusCode < 200 || httpResponse.StatusCode >= 300 || responseEnvelope.Code != "00" {
		return "", fmt.Errorf("nomba auth failed: %s", responseEnvelope.Description)
	}

	expiresAt, err := time.Parse(time.RFC3339, responseEnvelope.Data.ExpiresAt)
	if err != nil {
		expiresAt = time.Now().Add(25 * time.Minute)
	}

	c.token = &tokenState{
		AccessToken:  responseEnvelope.Data.AccessToken,
		RefreshToken: responseEnvelope.Data.RefreshToken,
		ExpiresAt:    expiresAt,
	}
	return c.token.AccessToken, nil
}

func (c *Client) clearToken() {
	c.tokenMu.Lock()
	defer c.tokenMu.Unlock()
	c.token = nil
}

type ProviderResponseLog struct {
	Method       string
	Path         string
	RequestBody  []byte
	ResponseBody []byte
	ResponseCode string
	HTTPStatus   int
	DurationMS   int
}
