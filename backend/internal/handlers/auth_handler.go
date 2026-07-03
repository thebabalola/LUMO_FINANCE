package handlers

import (
	"errors"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"

	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/auth"
	"github.com/vatilize-labs/lumo-finance/internal/otp"
	"github.com/vatilize-labs/lumo-finance/internal/services"
)

var requestValidator = validator.New()

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (handler *AuthHandler) Register(c *fiber.Ctx) error {
	var input services.RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	userID, err := handler.authService.Register(c.Context(), input, audit.RequestInfoFromFiber(c))
	if err != nil {
		if errors.Is(err, services.ErrEmailAlreadyRegistered) {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"user_id": userID,
		"message": "Registration successful. Check your email for the verification code.",
	})
}

type verifyOTPRequest struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

func (handler *AuthHandler) VerifyOTP(c *fiber.Ctx) error {
	var request verifyOTPRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	tokenPair, err := handler.authService.VerifyOTP(c.Context(), request.Email, request.Code, audit.RequestInfoFromFiber(c))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return fiber.NewError(fiber.StatusNotFound, err.Error())
		case errors.Is(err, otp.ErrCodeNotFound),
			errors.Is(err, otp.ErrCodeInvalid),
			errors.Is(err, otp.ErrTooManyAttempts):
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		}
		return err
	}

	return c.JSON(tokenPair)
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

func (handler *AuthHandler) Login(c *fiber.Ctx) error {
	var request loginRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	tokenPair, userProfile, err := handler.authService.Login(c.Context(), request.Email, request.Password, audit.RequestInfoFromFiber(c))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			return fiber.NewError(fiber.StatusUnauthorized, err.Error())
		case errors.Is(err, services.ErrAccountNotVerified), errors.Is(err, services.ErrAccountNotActive):
			return fiber.NewError(fiber.StatusForbidden, err.Error())
		}
		return err
	}

	return c.JSON(fiber.Map{
		"access_token":  tokenPair.AccessToken,
		"refresh_token": tokenPair.RefreshToken,
		"expires_in":    tokenPair.ExpiresIn,
		"user":          userProfile,
	})
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (handler *AuthHandler) Refresh(c *fiber.Ctx) error {
	var request refreshRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := requestValidator.Struct(request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	tokenPair, err := handler.authService.Refresh(c.Context(), request.RefreshToken, audit.RequestInfoFromFiber(c))
	if err != nil {
		if errors.Is(err, auth.ErrRefreshTokenNotFound) {
			return fiber.NewError(fiber.StatusUnauthorized, "refresh token is invalid or expired")
		}
		return err
	}
	return c.JSON(tokenPair)
}

func (handler *AuthHandler) Logout(c *fiber.Ctx) error {
	var request refreshRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := handler.authService.Logout(c.Context(), request.RefreshToken, audit.RequestInfoFromFiber(c)); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"message": "Logged out"})
}

type setPinRequest struct {
	Pin string `json:"pin" validate:"required"`
}

func (handler *AuthHandler) SetTransactionPin(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request setPinRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}
	if err := auth.ValidateTransactionPinFormat(request.Pin); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	if err := handler.authService.SetTransactionPin(c.Context(), userID, request.Pin, audit.RequestInfoFromFiber(c)); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"message": "Transaction PIN set"})
}

func (handler *AuthHandler) VerifyTransactionPin(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var request setPinRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	pinHash, err := handler.authService.GetTransactionPinHash(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	if !auth.CompareTransactionPin(pinHash, request.Pin) {
		return fiber.NewError(fiber.StatusUnauthorized, "incorrect transaction PIN")
	}
	return c.JSON(fiber.Map{"valid": true})
}
