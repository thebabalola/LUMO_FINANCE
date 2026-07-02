package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"github.com/vatilize-labs/lumo-finance/internal/db"
	"github.com/vatilize-labs/lumo-finance/internal/handlers"
	"github.com/vatilize-labs/lumo-finance/internal/middleware"
	"github.com/vatilize-labs/lumo-finance/internal/redis"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize database
	dbPool, err := db.Init()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer dbPool.Close()

	// Initialize Redis
	redisClient, err := redis.Init()
	if err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}
	defer redisClient.Close()

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Lumo Finance API",
	})

	// Middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type,Authorization",
	}))
	app.Use(middleware.Logger())
	app.Use(middleware.ErrorHandler())

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// API Routes
	api := app.Group("/api/v1")

	// Auth routes
	authHandler := handlers.NewAuthHandler(dbPool)
	api.Post("/auth/register", authHandler.Register)
	api.Post("/auth/login", authHandler.Login)
	api.Post("/auth/logout", authHandler.Logout)

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.AuthRequired())

	// User routes
	userHandler := handlers.NewUserHandler(dbPool)
	protected.Get("/users/me", userHandler.GetProfile)
	protected.Put("/users/me", userHandler.UpdateProfile)

	// Wallet routes
	walletHandler := handlers.NewWalletHandler(dbPool, redisClient)
	protected.Get("/wallet/balance", walletHandler.GetBalance)
	protected.Get("/wallet/accounts", walletHandler.GetAccounts)
	protected.Post("/wallet/link-account", walletHandler.LinkAccount)

	// Transaction routes
	transactionHandler := handlers.NewTransactionHandler(dbPool, redisClient)
	protected.Get("/transactions", transactionHandler.List)
	protected.Get("/transactions/:id", transactionHandler.GetByID)
	protected.Post("/transactions/transfer", transactionHandler.CreateTransfer)
	protected.Post("/transactions/airtime", transactionHandler.BuyAirtime)
	protected.Post("/transactions/data", transactionHandler.BuyData)
	protected.Post("/transactions/bill", transactionHandler.PayBill)

	// Analytics routes
	analyticsHandler := handlers.NewAnalyticsHandler(dbPool)
	protected.Get("/analytics/spending", analyticsHandler.GetSpending)
	protected.Get("/analytics/summary", analyticsHandler.GetSummary)

	// Nomba webhook (for transaction updates)
	app.Post("/webhooks/nomba", handlers.HandleNombaWebhook(dbPool))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("🚀 Server running on port %s", port)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
