package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func signatureCheckApp(webhookSecret string) *fiber.App {
	app := fiber.New()
	app.Post("/webhook", func(c *fiber.Ctx) error {
		if !verifyNombaWebhookSignature(c, webhookSecret) {
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		return c.SendStatus(fiber.StatusOK)
	})
	return app
}

func computeSignature(webhookSecret string, body string) []byte {
	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write([]byte(body))
	return mac.Sum(nil)
}

func TestVerifyNombaWebhookSignature(t *testing.T) {
	const webhookSecret = "test-webhook-secret"
	const body = `{"event_type":"payout_success","data":{"merchantTxRef":"ref-1"}}`
	validSignature := computeSignature(webhookSecret, body)

	testCases := []struct {
		name           string
		signatureValue string
		headerName     string
		wantStatus     int
	}{
		{"valid hex signature", hex.EncodeToString(validSignature), "nomba-sig-value", fiber.StatusOK},
		{"valid base64 signature", base64.StdEncoding.EncodeToString(validSignature), "nomba-sig-value", fiber.StatusOK},
		{"valid signature in alternate header", hex.EncodeToString(validSignature), "x-nomba-signature", fiber.StatusOK},
		{"wrong signature", hex.EncodeToString(computeSignature("other-secret", body)), "nomba-sig-value", fiber.StatusUnauthorized},
		{"garbage signature", "not-a-signature", "nomba-sig-value", fiber.StatusUnauthorized},
		{"missing signature header", "", "", fiber.StatusUnauthorized},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			app := signatureCheckApp(webhookSecret)
			request := httptest.NewRequest("POST", "/webhook", strings.NewReader(body))
			request.Header.Set("Content-Type", "application/json")
			if testCase.headerName != "" {
				request.Header.Set(testCase.headerName, testCase.signatureValue)
			}

			response, err := app.Test(request)
			if err != nil {
				t.Fatalf("app.Test: %v", err)
			}
			defer func() { _, _ = io.Copy(io.Discard, response.Body); _ = response.Body.Close() }()

			if response.StatusCode != testCase.wantStatus {
				t.Errorf("got status %d, want %d", response.StatusCode, testCase.wantStatus)
			}
		})
	}
}

func TestVerifyNombaWebhookSignatureTamperedBody(t *testing.T) {
	const webhookSecret = "test-webhook-secret"
	validSignature := computeSignature(webhookSecret, `{"amount":100}`)

	app := signatureCheckApp(webhookSecret)
	request := httptest.NewRequest("POST", "/webhook", strings.NewReader(`{"amount":999999}`))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("nomba-sig-value", hex.EncodeToString(validSignature))

	response, err := app.Test(request)
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	defer func() { _, _ = io.Copy(io.Discard, response.Body); _ = response.Body.Close() }()

	if response.StatusCode != fiber.StatusUnauthorized {
		t.Errorf("tampered body accepted: got status %d, want %d", response.StatusCode, fiber.StatusUnauthorized)
	}
}
