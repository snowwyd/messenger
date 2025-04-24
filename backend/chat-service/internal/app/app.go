package app

import (
	"log/slog"

	appgrpc "chat-service/internal/app/app-grpc"
	"chat-service/internal/config"
	"chat-service/internal/infrastructure/mongodb"
	"chat-service/internal/services"
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
		cfg.Yaml.Storage.ChatsColName,
		cfg.Yaml.Storage.ChannelsColName,
		cfg.Yaml.Storage.MessagesColName,
	)

	// chatService := services.NewChatService(log, storage, storage)
	// channelService := services.NewChannelService(log, storage, storage, storage)
	// messageService := services.NewMessageService(
	// 	log,
	// 	storage,
	// 	storage,
	// 	storage,
	// 	cfg.Yaml.App.MaxMessageLength,
	// )

	conversationService := services.NewConversationService(log, storage, storage, storage, cfg.Yaml.App.MaxMessageLength)
	viewService := services.NewViewService(log, storage, storage, storage)
	managerService := services.NewManagerService(log, storage, storage, storage)

	appgrpc := appgrpc.New(
		log,
		conversationService,
		viewService,
		managerService,
		cfg.Yaml.GRPC.Port,
		cfg.DotEnv.Secrets.AppSecret,
	)

	return &App{
		GRPCSrv: appgrpc,
	}
}
