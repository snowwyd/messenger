package app

import (
	"log/slog"

	grpcapp "github.com/snowwyd/messenger/msgchat/internal/app/grpc"
	"github.com/snowwyd/messenger/msgchat/internal/infrastructure/mongodb"
	"github.com/snowwyd/messenger/msgchat/internal/services"
)

type App struct {
	GRPCSrv *grpcapp.App
}

func New(
	log *slog.Logger,
	grpcPort int,
	storagePath string,
	storageName string,
	appSecret string,
	maxMessageLength int,
) *App {

	storage, err := mongodb.New(storagePath, storageName)
	if err != nil {
		panic(err)
	}

	chatService := services.NewChatService(log, storage, storage)
	channelService := services.NewChannelService(log, storage, storage, storage)
	messageService := services.NewMessageService(log, storage, storage, storage, maxMessageLength)

	grpcApp := grpcapp.New(log, chatService, channelService, messageService, grpcPort, appSecret)

	return &App{
		GRPCSrv: grpcApp,
	}
}
