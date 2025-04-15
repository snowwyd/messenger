package app

import (
	"log/slog"
	"time"

	appgrpc "user-service/internal/app/app-grpc"

	"user-service/internal/infrastructure/mongodb"
	"user-service/internal/services"
)

type App struct {
	GRPCSrv *appgrpc.App
}

func New(
	log *slog.Logger,
	grpcPort int,
	storagePath string,
	storageName string,
	tokenTTL time.Duration,
	appSecret string,
) *App {

	storage, err := mongodb.New(storagePath, storageName)
	if err != nil {
		panic(err)
	}

	authService := services.NewAuthService(log, storage, storage, tokenTTL, appSecret)
	usersService := services.NewUsersService(log, storage)

	grpcApp := appgrpc.New(log, authService, usersService, grpcPort)

	return &App{
		GRPCSrv: grpcApp,
	}
}
