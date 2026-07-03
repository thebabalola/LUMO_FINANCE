package middleware

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
)

func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		log.Printf("%s %s", c.Method(), c.Path())
		return c.Next()
	}
}

// ErrorHandler maps fiber.*Error to their intended status codes and hides
// internal error details behind a generic 500.
func ErrorHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()
		if err == nil {
			return nil
		}

		var fiberError *fiber.Error
		if errors.As(err, &fiberError) {
			return c.Status(fiberError.Code).JSON(fiber.Map{
				"error": fiberError.Message,
			})
		}

		log.Printf("Unhandled error on %s %s: %v", c.Method(), c.Path(), err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}
}
