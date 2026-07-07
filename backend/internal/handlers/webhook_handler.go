package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/vatilize-labs/lumo-finance/internal/audit"
)

type nombaWebhookPayload struct {
	EventType string `json:"event_type"`
	Data      struct {
		MerchantTxRef string `json:"merchantTxRef"`
		ID            string `json:"id"`
		Status        string `json:"status"`
	} `json:"data"`
}

// verifyNombaWebhookSignature checks the HMAC-SHA256 of the raw request body
// against the signature header, using the shared webhook secret. Both hex and
// base64 signature encodings are accepted, and both header spellings Nomba
// has used, so the check survives provider-side format changes.
func verifyNombaWebhookSignature(c *fiber.Ctx, webhookSecret string) bool {
	signatureHeader := c.Get("nomba-sig-value")
	if signatureHeader == "" {
		signatureHeader = c.Get("x-nomba-signature")
	}
	if signatureHeader == "" {
		return false
	}

	mac := hmac.New(sha256.New, []byte(webhookSecret))
	mac.Write(c.Body())
	expectedSignature := mac.Sum(nil)

	if decoded, err := hex.DecodeString(signatureHeader); err == nil && hmac.Equal(decoded, expectedSignature) {
		return true
	}
	if decoded, err := base64.StdEncoding.DecodeString(signatureHeader); err == nil && hmac.Equal(decoded, expectedSignature) {
		return true
	}
	return false
}

// HandleNombaWebhook updates transaction status from Nomba's asynchronous
// notifications, matched by our reference. When webhookSecret is set the
// payload signature is verified; an empty secret (sandbox/dev) skips the
// check since the deterministic sandbox client never calls this endpoint.
func HandleNombaWebhook(dbPool *pgxpool.Pool, auditRecorder *audit.Recorder, webhookSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if webhookSecret != "" && !verifyNombaWebhookSignature(c, webhookSecret) {
			auditRecorder.Record(c.Context(), audit.Event{
				EventType:    "transaction.webhook_rejected",
				ResourceType: "transaction",
				Metadata:     map[string]interface{}{"reason": "invalid signature"},
			})
			return fiber.NewError(fiber.StatusUnauthorized, "invalid webhook signature")
		}

		var payload nombaWebhookPayload
		if err := c.BodyParser(&payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid webhook payload")
		}
		if payload.Data.MerchantTxRef == "" {
			return fiber.NewError(fiber.StatusBadRequest, "missing merchantTxRef")
		}

		newStatus := "completed"
		var completedAt *time.Time
		now := time.Now()
		switch payload.Data.Status {
		case "SUCCESS", "COMPLETED":
			completedAt = &now
		case "FAILED", "DECLINED":
			newStatus = "failed"
		default:
			newStatus = "pending"
		}

		commandTag, err := dbPool.Exec(c.Context(),
			`UPDATE transactions
			 SET status = $1, nomba_reference = COALESCE(NULLIF($2, ''), nomba_reference),
			     completed_at = COALESCE($3, completed_at), updated_at = NOW()
			 WHERE reference = $4`,
			newStatus, payload.Data.ID, completedAt, payload.Data.MerchantTxRef)
		if err != nil {
			return err
		}
		if commandTag.RowsAffected() == 0 {
			log.Printf("nomba webhook: no transaction found for reference %s", payload.Data.MerchantTxRef)
		}

		auditRecorder.Record(c.Context(), audit.Event{
			EventType:    "transaction.webhook_received",
			ResourceType: "transaction",
			ResourceID:   payload.Data.MerchantTxRef,
			Metadata: map[string]interface{}{
				"nomba_status": payload.Data.Status,
				"event_type":   payload.EventType,
			},
		})
		return c.JSON(fiber.Map{"received": true})
	}
}
