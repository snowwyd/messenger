package app

import (
	"log/slog"
	grpcapp "msgauth/internal/app/grpc"
	"msgauth/internal/services/auth"
	mongostorage "msgauth/internal/storage/mongodb"
	"time"
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
	storage, err := mongostorage.New(storagePath, storageName)
	if err != nil {
		panic(err)
	}

	authService := auth.New(log, storage, storage, tokenTTL, appSecret)

	grpcApp := grpcapp.New(log, authService, grpcPort)

	return &App{
		GRPCSrv: grpcApp,
	}
}
