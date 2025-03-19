package app

import (
	"log/slog"
	"time"

	grpcapp "github.com/snowwyd/messenger/msgauth/internal/app/grpc"
	"github.com/snowwyd/messenger/msgauth/internal/services/auth"
	mongostorage "github.com/snowwyd/messenger/msgauth/internal/storage/mongodb"
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
