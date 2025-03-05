// Входная точка в приложение
package main

import (
	"log/slog"
	"msgauth/internal/app"
	"msgauth/internal/config"
	"msgauth/internal/lib/logger"
	"os"
	"os/signal"
	"syscall"
)

const (
	envLocal = "local"
	envDev   = "dev"
	envProd  = "prod"
)

func main() {
	// инициализация конфига
	cfg := config.MustLoad()
	storageName := "auth"

	log := setupLogger(cfg.Env)
	log.Info("starting application",
		slog.String("env", cfg.Env),
		slog.Any("tokenTTL", cfg.TokenTTL),
		slog.Any("GRPC", cfg.GRPC))

	// инициализация приложения
	application := app.New(log, cfg.GRPC.Port, cfg.StoragePath, storageName, cfg.TokenTTL, cfg.AppSecret)
	log.Info("storageName", slog.String("storageName", storageName))
	// асинхронный запуск сервера из-за необходимости асинхронно слушать сигналы ОС
	go application.GRPCSrv.MustRun()

	// graceful shutdown
	stop := make(chan os.Signal, 1)
	// получение сигнала от ОС о завершении программы и запись в канал
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	// ожидание записи в канал, в противном случае остановка main на этой строчке
	sign := <-stop
	log.Info("stopping application", slog.String("signal", sign.String()))

	application.GRPCSrv.Stop()

	log.Info("application stopped")
}

// setupLogger настраивает логгер в зависимости от окружения и возвращает объект *slog.Logger
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

// setupPrettySlog настраивает красивый логгер
func setupPrettySlog() *slog.Logger {
	opts := logger.PrettyHandlerOptions{
		SlogOpts: &slog.HandlerOptions{
			Level: slog.LevelDebug,
		},
	}

	handler := opts.NewPrettyHandler(os.Stdout)
	return slog.New(handler)
}
