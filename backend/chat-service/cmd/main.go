package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"chat-service/internal/app"

	"chat-service/internal/config"
	"chat-service/internal/lib/logger"
)

func main() {
	cfg := config.MustLoad()

	log := logger.SetupLogger(cfg.Yaml.Env)
	log.Info("starting application",
		slog.String("env", cfg.Yaml.Env),
		slog.Any("GRPC", cfg.Yaml.GRPC))

	application := app.New(log, cfg)

	go application.GRPCSrv.MustRun()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	sign := <-stop
	log.Info("stopping application", slog.String("signal", sign.String()))

	application.GRPCSrv.Stop()

	log.Info("application stopped")
}
