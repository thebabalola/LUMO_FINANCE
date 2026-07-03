package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/vatilize-labs/lumo-finance/internal/auth"
)

// AuthRequired verifies the Bearer access token and stores the authenticated
// user's ID in c.Locals("user_id") for downstream handlers.
func AuthRequired(tokenIssuer *auth.TokenIssuer) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authorizationHeader := c.Get("Authorization")
		if authorizationHeader == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing Authorization header")
		}

		tokenString, found := strings.CutPrefix(authorizationHeader, "Bearer ")
		if !found || tokenString == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "Authorization header must be a Bearer token")
		}

		claims, err := tokenIssuer.VerifyAccessToken(tokenString)
		if err != nil {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid or expired access token")
		}

		c.Locals("user_id", claims.UserID)
		c.Locals("access_token_id", claims.TokenID)
		return c.Next()
	}
}
