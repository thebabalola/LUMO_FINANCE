package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"github.com/vatilize-labs/lumo-finance/internal/ai"
	"github.com/vatilize-labs/lumo-finance/internal/ai/claude"
	"github.com/vatilize-labs/lumo-finance/internal/ai/conversation"
	"github.com/vatilize-labs/lumo-finance/internal/ai/pending"
	"github.com/vatilize-labs/lumo-finance/internal/ai/tools"
	"github.com/vatilize-labs/lumo-finance/internal/audit"
	"github.com/vatilize-labs/lumo-finance/internal/auth"
	"github.com/vatilize-labs/lumo-finance/internal/config"
	"github.com/vatilize-labs/lumo-finance/internal/db"
	"github.com/vatilize-labs/lumo-finance/internal/handlers"
	"github.com/vatilize-labs/lumo-finance/internal/middleware"
	"github.com/vatilize-labs/lumo-finance/internal/nomba"
	"github.com/vatilize-labs/lumo-finance/internal/otp"
	"github.com/vatilize-labs/lumo-finance/internal/redis"
	"github.com/vatilize-labs/lumo-finance/internal/services"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	appConfig, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	dbPool, err := db.Init()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbPool.Close()

	redisClient, err := redis.Init()
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer func() { _ = redisClient.Close() }()

	// Auth building blocks
	tokenIssuer := auth.NewTokenIssuer(appConfig.JWTSecret, appConfig.AccessTokenTTL)
	refreshTokenStore := auth.NewRefreshTokenStore(redisClient, appConfig.RefreshTokenTTL)
	otpService := otp.NewOneTimePasswordService(redisClient, otp.NewConsoleSender(), appConfig.OTPTTL)
	auditRecorder := audit.NewRecorder(dbPool)

	// Nomba client: sandbox by default so everything works without credentials
	var nombaClient nomba.Client
	if appConfig.NombaMode == "live" {
		nombaClient = nomba.NewHTTPClient(appConfig.NombaBaseURL, appConfig.NombaAPIKey)
	} else {
		nombaClient = nomba.NewSandboxClient()
		log.Println("Nomba client running in sandbox mode (set NOMBA_MODE=live for real payments)")
	}

	// Services
	authService := services.NewAuthService(dbPool, tokenIssuer, refreshTokenStore, otpService, auditRecorder)
	userService := services.NewUserService(dbPool)
	walletService := services.NewWalletService(dbPool)
	transactionService := services.NewTransactionService(dbPool, nombaClient, auditRecorder)
	analyticsService := services.NewAnalyticsService(dbPool)

	// AI layer
	claudeClient := claude.NewClient(appConfig.AnthropicAPIKey, appConfig.ClaudeModel)
	conversationStore := conversation.NewStore(redisClient, appConfig.ConversationTTL)
	pendingActionStore := pending.NewStore(redisClient)
	readOnlyToolExecutor := tools.NewReadOnlyToolExecutor(walletService, transactionService, analyticsService, nombaClient)
	chatService := ai.NewChatService(claudeClient, conversationStore, pendingActionStore,
		readOnlyToolExecutor, authService, transactionService, auditRecorder, redisClient)

	app := fiber.New(fiber.Config{
		AppName: "Lumo Finance API",
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: appConfig.AllowedOrigins,
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type,Authorization",
	}))
	app.Use(middleware.Logger())
	app.Use(middleware.ErrorHandler())

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api/v1")
	api.Use(middleware.RateLimit(redisClient, middleware.RateLimitByIP("global", 100, time.Minute)))

	// Auth routes (public, tighter limits against brute force)
	authRateLimit := middleware.RateLimit(redisClient, middleware.RateLimitByIP("auth", 10, time.Minute))
	otpRateLimit := middleware.RateLimit(redisClient, middleware.RateLimitByIP("otp", 5, time.Minute))
	authHandler := handlers.NewAuthHandler(authService)
	api.Post("/auth/register", authRateLimit, authHandler.Register)
	api.Post("/auth/verify-otp", otpRateLimit, authHandler.VerifyOTP)
	api.Post("/auth/login", authRateLimit, authHandler.Login)
	api.Post("/auth/refresh", authRateLimit, authHandler.Refresh)
	api.Post("/auth/logout", authRateLimit, authHandler.Logout)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthRequired(tokenIssuer))

	// User routes
	userHandler := handlers.NewUserHandler(userService)
	protected.Get("/users/me", userHandler.GetProfile)
	protected.Put("/users/me", userHandler.UpdateProfile)
	protected.Post("/users/me/pin", authHandler.SetTransactionPin)
	protected.Post("/users/me/pin/verify", authHandler.VerifyTransactionPin)

	// Wallet routes
	walletHandler := handlers.NewWalletHandler(walletService)
	protected.Get("/wallet/balance", walletHandler.GetBalance)
	protected.Get("/wallet/accounts", walletHandler.GetAccounts)
	protected.Post("/wallet/link-account", walletHandler.LinkAccount)

	// Transaction routes
	transactionHandler := handlers.NewTransactionHandler(transactionService)
	protected.Get("/transactions", transactionHandler.List)
	protected.Get("/transactions/:id", transactionHandler.GetByID)

	// Analytics routes
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)
	protected.Get("/analytics/spending", analyticsHandler.GetSpending)
	protected.Get("/analytics/summary", analyticsHandler.GetSummary)

	// AI chat routes
	chatRateLimit := middleware.RateLimit(redisClient, middleware.RateLimitByUser("chat", 20, time.Minute))
	confirmRateLimit := middleware.RateLimit(redisClient, middleware.RateLimitByUser("confirm", 10, time.Minute))
	chatHandler := handlers.NewChatHandler(chatService)
	protected.Post("/chat", chatRateLimit, chatHandler.Chat)
	protected.Post("/chat/stream", chatRateLimit, chatHandler.ChatStream)
	protected.Post("/chat/confirm", confirmRateLimit, chatHandler.Confirm)
	protected.Post("/chat/cancel", chatHandler.Cancel)

	// Nomba webhook (for transaction updates)
	app.Post("/webhooks/nomba", handlers.HandleNombaWebhook(dbPool, auditRecorder))

	log.Printf("🚀 Server running on port %s", appConfig.Port)
	if err := app.Listen(fmt.Sprintf(":%s", appConfig.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
