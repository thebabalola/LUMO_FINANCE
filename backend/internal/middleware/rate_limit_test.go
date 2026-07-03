package middleware

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

func newRateLimitedApp(t *testing.T, limit int64) (*fiber.App, *miniredis.Miniredis) {
	t.Helper()
	miniRedisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{Addr: miniRedisServer.Addr()})

	app := fiber.New()
	app.Use(RateLimit(redisClient, RateLimitByIP("test", limit, time.Minute)))
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("ok")
	})
	return app, miniRedisServer
}

func TestRateLimitAllowsUnderLimit(t *testing.T) {
	app, _ := newRateLimitedApp(t, 3)

	for requestNumber := 1; requestNumber <= 3; requestNumber++ {
		response, err := app.Test(httptest.NewRequest("GET", "/", nil))
		if err != nil {
			t.Fatalf("request %d failed: %v", requestNumber, err)
		}
		if response.StatusCode != fiber.StatusOK {
			t.Errorf("request %d: expected 200, got %d", requestNumber, response.StatusCode)
		}
	}
}

func TestRateLimitRejectsOverLimit(t *testing.T) {
	app, _ := newRateLimitedApp(t, 3)

	for requestNumber := 1; requestNumber <= 3; requestNumber++ {
		if _, err := app.Test(httptest.NewRequest("GET", "/", nil)); err != nil {
			t.Fatalf("request %d failed: %v", requestNumber, err)
		}
	}

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if err != nil {
		t.Fatalf("over-limit request failed: %v", err)
	}
	if response.StatusCode != fiber.StatusTooManyRequests {
		t.Errorf("expected 429 once over the limit, got %d", response.StatusCode)
	}
	if response.Header.Get("Retry-After") == "" {
		t.Error("expected a Retry-After header on 429 responses")
	}
}

func TestRateLimitResetsAfterWindow(t *testing.T) {
	app, miniRedisServer := newRateLimitedApp(t, 1)

	if _, err := app.Test(httptest.NewRequest("GET", "/", nil)); err != nil {
		t.Fatalf("first request failed: %v", err)
	}

	// miniredis only advances TTLs via FastForward — simulates the window elapsing.
	miniRedisServer.FastForward(2 * time.Minute)

	response, err := app.Test(httptest.NewRequest("GET", "/", nil))
	if err != nil {
		t.Fatalf("post-window request failed: %v", err)
	}
	if response.StatusCode != fiber.StatusOK {
		t.Errorf("expected 200 after the window reset, got %d", response.StatusCode)
	}
}
