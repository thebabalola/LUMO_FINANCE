-- Payment service fields and audit tables for Nomba integration.

INSERT INTO users (id, email, name, phone, password_hash, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@lumo.local', 'Demo User', '08000000000', 'demo', 'active')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS fee BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_debit BIGINT,
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'NGN',
    ADD COLUMN IF NOT EXISTS merchant_tx_ref VARCHAR(150),
    ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'nomba',
    ADD COLUMN IF NOT EXISTS provider_transaction_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS provider_session_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS recipient_account_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS recipient_account_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS recipient_bank_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS recipient_bank_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS network VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bill_provider VARCHAR(100),
    ADD COLUMN IF NOT EXISTS customer_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS meter_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS payer_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS receipt_json JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP;

UPDATE transactions SET total_debit = amount WHERE total_debit IS NULL;
UPDATE transactions SET merchant_tx_ref = reference WHERE merchant_tx_ref IS NULL AND reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_merchant_tx_ref ON transactions(merchant_tx_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_transaction_id ON transactions(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_session_id ON transactions(provider_session_id);

CREATE TABLE IF NOT EXISTS transaction_status_history (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_status_history_transaction_id ON transaction_status_history(transaction_id);

CREATE TABLE IF NOT EXISTS provider_request_logs (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    request_body JSONB DEFAULT '{}'::jsonb,
    response_body JSONB DEFAULT '{}'::jsonb,
    response_code VARCHAR(50),
    http_status INT,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_provider_request_logs_transaction_id ON provider_request_logs(transaction_id);

CREATE TABLE IF NOT EXISTS provider_webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    request_id VARCHAR(150),
    signature_valid BOOLEAN DEFAULT false,
    matched_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    raw_headers JSONB NOT NULL,
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMP,
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, request_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_webhook_events_transaction_id ON provider_webhook_events(matched_transaction_id);

CREATE TABLE IF NOT EXISTS bank_cache (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
