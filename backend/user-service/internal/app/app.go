package app

import (
	"log/slog"

	appgrpc "user-service/internal/app/app-grpc"
	"user-service/internal/config"

	"user-service/internal/infrastructure/mongodb"
	"user-service/internal/services"
)

type App struct {
	GRPCSrv *appgrpc.App
}

func New(
	log *slog.Logger,
	cfg *config.Config,
) *App {
	storage := mongodb.New(
		cfg.DotEnv.Storage.StoragePath,
		cfg.Yaml.Storage.StorageName,
		cfg.Yaml.Storage.UsersColName,
	)

	authService := services.NewAuthService(
		log,
		storage,
		storage,
		cfg.Yaml.TokenTTL,
		cfg.DotEnv.Secrets.AppSecret,
	)
	usersService := services.NewUsersService(log, storage)

	grpcApp := appgrpc.New(
		log,
		authService,
		usersService,
		cfg.Yaml.GRPC.Port,
	)

	return &App{
		GRPCSrv: grpcApp,
	}
}
