package app

import (
	"log/slog"
	grpcapp "msgchat/internal/app/grpc"
	"msgchat/internal/services/chat"
	"msgchat/internal/storage/mongodb"
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

	storage, err := mongodb.New(storagePath, storageName)
	if err != nil {
		panic(err)
	}

	chatService := chat.New(log, storage, storage, storage, storage, tokenTTL, appSecret)

	grpcApp := grpcapp.New(log, chatService, grpcPort, appSecret)

	return &App{
		GRPCSrv: grpcApp,
	}
}
