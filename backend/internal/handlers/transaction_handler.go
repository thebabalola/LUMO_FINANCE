package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	"github.com/vatilize-labs/lumo-finance/internal/services"
)

type TransactionHandler struct {
	transactionService *services.TransactionService
}

func NewTransactionHandler(transactionService *services.TransactionService) *TransactionHandler {
	return &TransactionHandler{transactionService: transactionService}
}

func (handler *TransactionHandler) List(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	limit := c.QueryInt("limit", 20)

	transactions, err := handler.transactionService.List(c.Context(), userID, limit)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"transactions": transactions})
}

func (handler *TransactionHandler) GetByID(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	transactionID := c.Params("id")

	transaction, err := handler.transactionService.GetByID(c.Context(), userID, transactionID)
	if err != nil {
		if errors.Is(err, services.ErrTransactionNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}
	return c.JSON(transaction)
}
