package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/snowwyd/messenger/msgchat/internal/app"
	"github.com/snowwyd/messenger/msgchat/internal/config"
	"github.com/snowwyd/messenger/msgchat/internal/lib/logger"
)

const (
	envLocal = "local"
	envDev   = "dev"
	envProd  = "prod"
)

func main() {
	cfg := config.MustLoad()
	storageName := "chat"

	log := setupLogger(cfg.Env)
	log.Info("starting application",
		slog.String("env", cfg.Env),
		slog.Any("GRPC", cfg.GRPC))

	application := app.New(log, cfg.GRPC.Port, cfg.StoragePath, storageName, cfg.AppSecret, cfg.MaxMessageLength)

	go application.GRPCSrv.MustRun()

	// graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	sign := <-stop
	log.Info("stopping application", slog.String("signal", sign.String()))

	application.GRPCSrv.Stop()

	log.Info("application stopped")
}

func setupLogger(env string) *slog.Logger {
	var log *slog.Logger
	switch env {
	case envLocal:
		log = setupPrettySlog()
	case envDev:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)
	case envProd:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)
	}
	return log
}

func setupPrettySlog() *slog.Logger {
	opts := logger.PrettyHandlerOptions{
		SlogOpts: &slog.HandlerOptions{
			Level: slog.LevelDebug,
		},
	}

	handler := opts.NewPrettyHandler(os.Stdout)
	return slog.New(handler)
}
