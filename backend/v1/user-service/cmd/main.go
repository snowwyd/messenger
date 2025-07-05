package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"user-service/internal/app"
	"user-service/internal/config"
	"user-service/internal/lib/logger"
)

func main() {
	cfg := config.MustLoad()

	log := logger.SetupLogger(cfg.Yaml.Env)
	log.Info(
		"starting application",
		slog.Any("env", cfg.Yaml.Env),
		slog.Any("grpc", cfg.Yaml.GRPC),
		slog.Any("tokenTTL", cfg.Yaml.TokenTTL),
	)

	application := app.New(log, cfg)

	go application.GRPCSrv.Run()

	stopCh := make(chan os.Signal, 1)
	signal.Notify(stopCh, syscall.SIGINT, syscall.SIGTERM)

	signal := <-stopCh
	log.Info("stopping application", slog.String("signal", signal.String()))

	application.GRPCSrv.Stop()

	log.Info("aplication stopped gracedully")
}
