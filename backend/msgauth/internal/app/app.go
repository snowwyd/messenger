package app

import (
	"log/slog"
	"time"

	grpcapp "github.com/snowwyd/messenger/msgauth/internal/app/grpc"
	"github.com/snowwyd/messenger/msgauth/internal/infrastructure/mongodb"
	"github.com/snowwyd/messenger/msgauth/internal/services"
)

type App struct {
	GRPCSrv *grpcapp.App
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

	grpcApp := grpcapp.New(log, authService, usersService, grpcPort)

	return &App{
		GRPCSrv: grpcApp,
	}
}
