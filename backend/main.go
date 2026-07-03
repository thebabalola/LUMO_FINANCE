package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"

	"github.com/vatilize-labs/lumo-finance/internal/auth"
	"github.com/vatilize-labs/lumo-finance/internal/config"
	"github.com/vatilize-labs/lumo-finance/internal/db"
	"github.com/vatilize-labs/lumo-finance/internal/handlers"
	"github.com/vatilize-labs/lumo-finance/internal/middleware"
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
	defer redisClient.Close()

	// Auth building blocks
	tokenIssuer := auth.NewTokenIssuer(appConfig.JWTSecret, appConfig.AccessTokenTTL)
	refreshTokenStore := auth.NewRefreshTokenStore(redisClient, appConfig.RefreshTokenTTL)
	otpService := otp.NewOneTimePasswordService(redisClient, otp.NewConsoleSender(), appConfig.OTPTTL)

	// Services
	authService := services.NewAuthService(dbPool, tokenIssuer, refreshTokenStore, otpService)

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

	// Auth routes (public)
	authHandler := handlers.NewAuthHandler(authService)
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/verify-otp", authHandler.VerifyOTP)
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/refresh", authHandler.Refresh)
	api.Post("/auth/logout", authHandler.Logout)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthRequired(tokenIssuer))

	// User routes
	userHandler := handlers.NewUserHandler(dbPool)
	protected.Get("/users/me", userHandler.GetProfile)
	protected.Put("/users/me", userHandler.UpdateProfile)
	protected.Post("/users/me/pin", authHandler.SetTransactionPin)
	protected.Post("/users/me/pin/verify", authHandler.VerifyTransactionPin)

	// Wallet routes
	walletHandler := handlers.NewWalletHandler(dbPool, redisClient)
	protected.Get("/wallet/balance", walletHandler.GetBalance)
	protected.Get("/wallet/accounts", walletHandler.GetAccounts)
	protected.Post("/wallet/link-account", walletHandler.LinkAccount)

	// Transaction routes
	transactionHandler := handlers.NewTransactionHandler(dbPool, redisClient)
	protected.Get("/transactions", transactionHandler.List)
	protected.Get("/transactions/:id", transactionHandler.GetByID)

	// Analytics routes
	analyticsHandler := handlers.NewAnalyticsHandler(dbPool)
	protected.Get("/analytics/spending", analyticsHandler.GetSpending)
	protected.Get("/analytics/summary", analyticsHandler.GetSummary)

	// Nomba webhook (for transaction updates)
	app.Post("/webhooks/nomba", handlers.HandleNombaWebhook(dbPool))

	log.Printf("🚀 Server running on port %s", appConfig.Port)
	if err := app.Listen(fmt.Sprintf(":%s", appConfig.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
