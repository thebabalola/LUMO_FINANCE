package audit

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Recorder writes audit events to the audit_logs table. Recording is
// best-effort: an audit failure is logged but never fails the user's
// request — availability wins over audit completeness here.
type Recorder struct {
	dbPool *pgxpool.Pool
}

type Event struct {
	UserID       string // empty for anonymous events (e.g. failed login for unknown email)
	EventType    string // e.g. "auth.login_success", "transaction.executed"
	ResourceType string // e.g. "user", "transaction", "conversation"
	ResourceID   string
	IPAddress    string
	UserAgent    string
	Metadata     map[string]interface{}
}

func NewRecorder(dbPool *pgxpool.Pool) *Recorder {
	return &Recorder{dbPool: dbPool}
}

func (recorder *Recorder) Record(ctx context.Context, event Event) {
	if recorder.dbPool == nil {
		// No database configured (unit tests) — auditing is best-effort.
		return
	}
	// Detach from the request context so cancellation doesn't drop the log,
	// but bound the write so a slow database can't pile up goroutines.
	writeCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 2*time.Second)
	defer cancel()

	var metadataJSON []byte
	if event.Metadata != nil {
		var err error
		metadataJSON, err = json.Marshal(event.Metadata)
		if err != nil {
			log.Printf("audit: failed to marshal metadata for %s: %v", event.EventType, err)
			metadataJSON = nil
		}
	}

	var userID interface{}
	if event.UserID != "" {
		userID = event.UserID
	}

	_, err := recorder.dbPool.Exec(writeCtx,
		`INSERT INTO audit_logs (user_id, event_type, resource_type, resource_id, ip_address, user_agent, metadata)
		 VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''), $7)`,
		userID, event.EventType, event.ResourceType, event.ResourceID,
		event.IPAddress, event.UserAgent, metadataJSON)
	if err != nil {
		log.Printf("audit: failed to record %s: %v", event.EventType, err)
	}
}
