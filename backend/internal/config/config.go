package config

import (
	"fmt"
	"os"
	"time"
)

type Config struct {
	Port        string
	Environment string

	AllowedOrigins string

	JWTSecret       string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration

	AnthropicAPIKey string
	ClaudeModel     string

	NombaAPIKey  string
	NombaBaseURL string
	NombaMode    string // "sandbox" or "live"
	// Shared secret for verifying Nomba webhook signatures. When empty
	// (e.g. sandbox/dev), webhook payloads are accepted unverified.
	NombaWebhookSecret string

	OTPTTL          time.Duration
	ConversationTTL time.Duration
}

func Load() (*Config, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}

	return &Config{
		Port:               envOrDefault("PORT", "8000"),
		Environment:        envOrDefault("ENVIRONMENT", "development"),
		AllowedOrigins:     envOrDefault("ALLOWED_ORIGINS", "http://localhost:3000"),
		JWTSecret:          jwtSecret,
		AccessTokenTTL:     15 * time.Minute,
		RefreshTokenTTL:    7 * 24 * time.Hour,
		AnthropicAPIKey:    os.Getenv("ANTHROPIC_API_KEY"),
		ClaudeModel:        envOrDefault("CLAUDE_MODEL", "claude-sonnet-5"),
		NombaAPIKey:        os.Getenv("NOMBA_API_KEY"),
		NombaBaseURL:       envOrDefault("NOMBA_BASE_URL", "https://api.nomba.com/v1"),
		NombaMode:          envOrDefault("NOMBA_MODE", "sandbox"),
		NombaWebhookSecret: os.Getenv("NOMBA_WEBHOOK_SECRET"),
		OTPTTL:             10 * time.Minute,
		ConversationTTL:    24 * time.Hour,
	}, nil
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

func envOrDefault(key string, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
