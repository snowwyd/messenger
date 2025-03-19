package app

import (
	"log/slog"
	"time"

	grpcapp "github.com/snowwyd/messenger/msgchat/internal/app/grpc"
	"github.com/snowwyd/messenger/msgchat/internal/services/chat"
	"github.com/snowwyd/messenger/msgchat/internal/storage/mongodb"
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

	chatService := chat.New(log, storage, storage, storage, tokenTTL, appSecret)

	grpcApp := grpcapp.New(log, chatService, grpcPort, appSecret)

	return &App{
		GRPCSrv: grpcApp,
	}
}
