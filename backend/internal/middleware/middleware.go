package middleware

import (
	"log"

	"github.com/gofiber/fiber/v2"
)

func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		log.Printf("%s %s", c.Method(), c.Path())
		return c.Next()
	}
}

func ErrorHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()
		if err != nil {
			log.Printf("Error: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Internal server error",
			})
		}
		return nil
	}
}

func AuthRequired() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// TODO: Implement JWT verification
		return c.Next()
	}
}
