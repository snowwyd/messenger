package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"
	"user-service/internal/app"
	"user-service/internal/config"
	"user-service/internal/lib/logger"
)

func main() {
	cfg := config.MustLoad()

	log := logger.SetupLogger(cfg.Yaml.Env)
	// TODO: uncomment for prod
	// log.Info(
	// 	"starting application",
	// 	slog.Any("env", cfg.Yaml.Env),
	// 	slog.Any("grpc", cfg.Yaml.GRPC),
	// 	slog.Any("tokenTTL", cfg.Yaml.TokenTTL),
	// )
	log.Info(
		"starting application",
		slog.Any("cfg", cfg),
	)

	application := app.New(log, cfg)

	go application.GRPCSrv.Run()

	stopCh := make(chan os.Signal, 1)
	signal.Notify(stopCh, syscall.SIGINT, syscall.SIGTERM)

	signal := <-stopCh
	log.Info("stopping application", slog.String("signal", signal.String()))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := application.DB.Close(ctx); err != nil {
		log.Error("error closing MongoDB", slog.Any("error", err))
	}
	application.GRPCSrv.Stop()

	log.Info("aplication stopped gracedully")
}
