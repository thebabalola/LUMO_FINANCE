package handlers

import (
	"github.com/gofiber/fiber/v2"

	"github.com/vatilize-labs/lumo-finance/internal/services"
)

type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

func (handler *AnalyticsHandler) GetSpending(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	period := c.Query("period", "month")

	summary, err := handler.analyticsService.GetSpending(c.Context(), userID, period)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(summary)
}

func (handler *AnalyticsHandler) GetSummary(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	summary, err := handler.analyticsService.GetSummary(c.Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(summary)
}
