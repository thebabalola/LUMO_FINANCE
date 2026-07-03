package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"

	"github.com/vatilize-labs/lumo-finance/internal/services"
)

type WalletHandler struct {
	walletService *services.WalletService
}

func NewWalletHandler(walletService *services.WalletService) *WalletHandler {
	return &WalletHandler{walletService: walletService}
}

func (handler *WalletHandler) GetBalance(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	balance, err := handler.walletService.GetBalance(c.Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrWalletNotFound) {
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		}
		return err
	}
	return c.JSON(balance)
}

func (handler *WalletHandler) GetAccounts(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	linkedAccounts, err := handler.walletService.GetAccounts(c.Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"accounts": linkedAccounts})
}

func (handler *WalletHandler) LinkAccount(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var input services.LinkAccountInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	linkedAccount, err := handler.walletService.LinkAccount(c.Context(), userID, input)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(linkedAccount)
}
