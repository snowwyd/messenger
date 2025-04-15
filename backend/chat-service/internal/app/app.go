package app

import (
	"log/slog"

	appgrpc "chat-service/internal/app/app-grpc"
	"chat-service/internal/infrastructure/mongodb"
	"chat-service/internal/services"
)

type App struct {
	GRPCSrv *appgrpc.App
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

	appgrpc := appgrpc.New(log, chatService, channelService, messageService, grpcPort, appSecret)

	return &App{
		GRPCSrv: appgrpc,
	}
}
