package middleware

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

// RateLimitConfig defines one rate-limit tier. KeyFunc chooses what the
// limit is counted against (client IP for anonymous routes, user ID for
// authenticated ones).
type RateLimitConfig struct {
	Scope   string
	Limit   int64
	Window  time.Duration
	KeyFunc func(c *fiber.Ctx) string
}

func RateLimitByIP(scope string, limit int64, window time.Duration) RateLimitConfig {
	return RateLimitConfig{
		Scope:  scope,
		Limit:  limit,
		Window: window,
		KeyFunc: func(c *fiber.Ctx) string {
			return c.IP()
		},
	}
}

func RateLimitByUser(scope string, limit int64, window time.Duration) RateLimitConfig {
	return RateLimitConfig{
		Scope:  scope,
		Limit:  limit,
		Window: window,
		KeyFunc: func(c *fiber.Ctx) string {
			if userID, ok := c.Locals("user_id").(string); ok {
				return userID
			}
			return c.IP()
		},
	}
}

// RateLimit is a Redis fixed-window counter: INCR the key, set the window
// TTL on first hit, reject once the counter passes the limit.
func RateLimit(redisClient *redis.Client, rateLimitConfig RateLimitConfig) fiber.Handler {
	return func(c *fiber.Ctx) error {
		redisKey := fmt.Sprintf("ratelimit:%s:%s", rateLimitConfig.Scope, rateLimitConfig.KeyFunc(c))

		requestCount, err := redisClient.Incr(c.Context(), redisKey).Result()
		if err != nil {
			// Redis being down should not take the API down with it.
			return c.Next()
		}
		if requestCount == 1 {
			redisClient.Expire(c.Context(), redisKey, rateLimitConfig.Window)
		}

		if requestCount > rateLimitConfig.Limit {
			retryAfter, ttlErr := redisClient.TTL(c.Context(), redisKey).Result()
			if ttlErr != nil || retryAfter < 0 {
				retryAfter = rateLimitConfig.Window
			}
			c.Set("Retry-After", fmt.Sprintf("%d", int(retryAfter.Seconds())))
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":               "rate_limited",
				"retry_after_seconds": int(retryAfter.Seconds()),
			})
		}
		return c.Next()
	}
}
