package handlers

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/vatilize-labs/lumo-finance/internal/services/nomba"
	"github.com/vatilize-labs/lumo-finance/internal/services/payments"
)

type AuthHandler struct {
	db *pgxpool.Pool
}

type UserHandler struct {
	db *pgxpool.Pool
}

type WalletHandler struct {
	db    *pgxpool.Pool
	redis *redis.Client
}

type TransactionHandler struct {
	db             *pgxpool.Pool
	redis          *redis.Client
	paymentService *payments.Service
}

type AnalyticsHandler struct {
	db *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{db: db}
}

func NewUserHandler(db *pgxpool.Pool) *UserHandler {
	return &UserHandler{db: db}
}

func NewWalletHandler(db *pgxpool.Pool, redis *redis.Client) *WalletHandler {
	return &WalletHandler{db: db, redis: redis}
}

func NewTransactionHandler(db *pgxpool.Pool, redis *redis.Client) *TransactionHandler {
	nombaClient := nomba.NewFromEnv()
	return &TransactionHandler{
		db:             db,
		redis:          redis,
		paymentService: payments.NewService(db, nombaClient),
	}
}

func NewAnalyticsHandler(db *pgxpool.Pool) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

// Auth Handlers
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Register endpoint"})
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Login endpoint"})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Logout endpoint"})
}

// User Handlers
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get profile endpoint"})
}

func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Update profile endpoint"})
}

// Wallet Handlers
func (h *WalletHandler) GetBalance(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get balance endpoint"})
}

func (h *WalletHandler) GetAccounts(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get accounts endpoint"})
}

func (h *WalletHandler) LinkAccount(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Link account endpoint"})
}

// Transaction Handlers
func (h *TransactionHandler) List(c *fiber.Ctx) error {
	transactions, err := h.paymentService.ListTransactions(c.Context(), userIDFromRequest(c))
	if err != nil {
		return errorJSON(c, fiber.StatusInternalServerError, "PROVIDER_ERROR", err.Error())
	}
	return successJSON(c, fiber.Map{"transactions": transactions, "nextCursor": nil})
}

func (h *TransactionHandler) GetByID(c *fiber.Ctx) error {
	transaction, err := h.paymentService.GetTransaction(c.Context(), userIDFromRequest(c), c.Params("id"))
	if err != nil {
		return errorJSON(c, fiber.StatusNotFound, "NOT_FOUND", err.Error())
	}
	return successJSON(c, transaction)
}

func (h *TransactionHandler) CreateTransfer(c *fiber.Ctx) error {
	var request payments.DraftRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	request.Type = "bank_transfer"
	draft, err := h.paymentService.CreateDraft(c.Context(), userIDFromRequest(c), request)
	if err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	return successJSON(c, draft)
}

func (h *TransactionHandler) BuyAirtime(c *fiber.Ctx) error {
	var request payments.DraftRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	request.Type = "airtime"
	draft, err := h.paymentService.CreateDraft(c.Context(), userIDFromRequest(c), request)
	if err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	return successJSON(c, draft)
}

func (h *TransactionHandler) BuyData(c *fiber.Ctx) error {
	var request payments.DraftRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	request.Type = "data"
	draft, err := h.paymentService.CreateDraft(c.Context(), userIDFromRequest(c), request)
	if err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	return successJSON(c, draft)
}

func (h *TransactionHandler) PayBill(c *fiber.Ctx) error {
	var request payments.DraftRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	request.Type = "electricity"
	draft, err := h.paymentService.CreateDraft(c.Context(), userIDFromRequest(c), request)
	if err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	return successJSON(c, draft)
}

func (h *TransactionHandler) FetchBanks(c *fiber.Ctx) error {
	banks, err := h.paymentService.GetBanks(c.Context())
	if err != nil {
		return errorJSON(c, fiber.StatusBadGateway, "PROVIDER_ERROR", err.Error())
	}
	return successJSON(c, fiber.Map{"banks": banks})
}

func (h *TransactionHandler) VerifyRecipient(c *fiber.Ctx) error {
	var request struct {
		AccountNumber string `json:"accountNumber"`
		BankCode      string `json:"bankCode"`
	}
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	recipient, err := h.paymentService.VerifyRecipient(c.Context(), request.AccountNumber, request.BankCode)
	if err != nil {
		return errorJSON(c, fiber.StatusBadGateway, "RECIPIENT_VERIFICATION_FAILED", err.Error())
	}
	return successJSON(c, recipient)
}

func (h *TransactionHandler) CreateDraft(c *fiber.Ctx) error {
	var request payments.DraftRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	draft, err := h.paymentService.CreateDraft(c.Context(), userIDFromRequest(c), request)
	if err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", err.Error())
	}
	return successJSON(c, draft)
}

func (h *TransactionHandler) Confirm(c *fiber.Ctx) error {
	var request payments.ConfirmRequest
	if err := c.BodyParser(&request); err != nil {
		return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid request body")
	}
	transaction, err := h.paymentService.ConfirmTransaction(c.Context(), userIDFromRequest(c), c.Params("id"), request.PIN)
	if err != nil {
		return errorJSON(c, fiber.StatusConflict, "TRANSACTION_NOT_CONFIRMABLE", err.Error())
	}
	return successJSON(c, transaction)
}

func (h *TransactionHandler) Execute(c *fiber.Ctx) error {
	transaction, err := h.paymentService.ExecuteTransaction(c.Context(), userIDFromRequest(c), c.Params("id"))
	if err != nil {
		return errorJSON(c, fiber.StatusConflict, "PROVIDER_ERROR", err.Error())
	}
	return successJSON(c, transaction)
}

func (h *TransactionHandler) DataPlans(c *fiber.Ctx) error {
	plans, err := h.paymentService.FetchDataPlans(c.Context(), c.Query("network"))
	if err != nil {
		return errorJSON(c, fiber.StatusBadGateway, "PROVIDER_ERROR", err.Error())
	}
	return successJSON(c, fiber.Map{"network": strings.ToUpper(c.Query("network")), "plans": plans})
}

func (h *TransactionHandler) ElectricityProviders(c *fiber.Ctx) error {
	providers, err := h.paymentService.FetchElectricityProviders(c.Context())
	if err != nil {
		return errorJSON(c, fiber.StatusBadGateway, "PROVIDER_ERROR", err.Error())
	}
	return successJSON(c, fiber.Map{"providers": providers})
}

// Analytics Handlers
func (h *AnalyticsHandler) GetSpending(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get spending endpoint"})
}

func (h *AnalyticsHandler) GetSummary(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"message": "Get summary endpoint"})
}

// Webhooks
func HandleNombaWebhook(db *pgxpool.Pool) fiber.Handler {
	paymentService := payments.NewService(db, nomba.NewFromEnv())
	return func(c *fiber.Ctx) error {
		payload := map[string]any{}
		if err := c.BodyParser(&payload); err != nil {
			return errorJSON(c, fiber.StatusBadRequest, "VALIDATION_ERROR", "Invalid webhook payload")
		}
		headers := map[string]string{}
		c.Request().Header.VisitAll(func(key []byte, value []byte) {
			headers[string(key)] = string(value)
		})
		if err := paymentService.HandleWebhook(c.Context(), headers, payload); err != nil {
			return errorJSON(c, fiber.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		}
		return c.JSON(fiber.Map{"received": true})
	}
}

func userIDFromRequest(c *fiber.Ctx) string {
	if userID := c.Get("X-User-Id"); userID != "" {
		return userID
	}
	if userID, ok := c.Locals("user_id").(string); ok && userID != "" {
		return userID
	}
	return "00000000-0000-0000-0000-000000000001"
}

func successJSON(c *fiber.Ctx, data any) error {
	return c.JSON(payments.APIResponse{Success: true, Data: data})
}

func errorJSON(c *fiber.Ctx, status int, code string, message string) error {
	return c.Status(status).JSON(payments.APIResponse{
		Success: false,
		Error: fiber.Map{
			"code":    code,
			"message": message,
		},
	})
}
