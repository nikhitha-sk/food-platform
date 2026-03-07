package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/food-platform/notification-service/internal/config"
	"github.com/food-platform/notification-service/internal/events"
	"github.com/food-platform/notification-service/internal/handlers"
	"github.com/food-platform/notification-service/internal/middleware"
	"github.com/food-platform/notification-service/internal/models"
	"github.com/food-platform/notification-service/internal/repository"
	"github.com/food-platform/notification-service/internal/service"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rabbitmq/amqp091-go"
	"go.uber.org/zap"
)

func main() {
	cfg := config.Load()

	var logger *zap.Logger
	var err error
	if cfg.AppEnv == "production" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		log.Fatalf("failed to init logger: %v", err)
	}
	defer logger.Sync() //nolint:errcheck

	db := config.ConnectDB(cfg.DatabaseURL)
	rdb := config.ConnectRedis(cfg.RedisURL)

	rbConn, err := amqp091.Dial(cfg.RabbitMQURL)
	if err != nil {
		logger.Fatal("failed to connect to RabbitMQ", zap.Error(err))
	}
	rbCh, err := rbConn.Channel()
	if err != nil {
		logger.Fatal("failed to open RabbitMQ channel", zap.Error(err))
	}

	if err := db.AutoMigrate(&models.Notification{}); err != nil {
		logger.Fatal("automigrate failed", zap.Error(err))
	}

	notifRepo := repository.NewNotificationRepository(db)
	notifSvc := service.NewNotificationService(notifRepo)
	notifH := handlers.NewNotificationHandler(notifSvc)

	consumer, err := events.NewConsumer(rbCh, notifSvc, logger)
	if err != nil {
		logger.Fatal("failed to create consumer", zap.Error(err))
	}
	consumer.Start()

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger(logger))
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"X-RateLimit-Limit", "X-RateLimit-Remaining"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))
	r.Use(middleware.RateLimit(rdb, 100, time.Minute))

	v1 := r.Group("/api/v1")
	{
		v1.GET("/notifications/health", notifH.Health)

		auth := middleware.JWTAuth(cfg.JWTSecret)
		protected := v1.Group("")
		protected.Use(auth)
		notifH.RegisterRoutes(protected)
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}
	go func() {
		logger.Info("notification-service starting", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server error", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("shutting down notification-service...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("forced shutdown", zap.Error(err))
	}

	sqlDB, _ := db.DB()
	sqlDB.Close()
	rdb.Close()
	rbCh.Close()
	rbConn.Close()
	logger.Info("notification-service stopped")
}
