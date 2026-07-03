package handlers

import (
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

// HandleNombaWebhook updates transaction status from Nomba's asynchronous
// notifications, matched by our reference.
// TODO: verify the webhook signature once real Nomba credentials/docs are
// available — until then this endpoint trusts the payload.
func HandleNombaWebhook(dbPool *pgxpool.Pool, auditRecorder *audit.Recorder) fiber.Handler {
	return func(c *fiber.Ctx) error {
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
