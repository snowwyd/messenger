package services

import (
	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/utils"
	"context"
	"log/slog"
)

type ManagerService struct {
	log             *slog.Logger
	chatProvider    interfaces.ChatProvider
	channelProvider interfaces.ChannelProvider
}

func NewManagerService(
	log *slog.Logger,
	chatProvider interfaces.ChatProvider,
	channelProvider interfaces.ChannelProvider,
	messageProvider interfaces.MessageProvider,
) *ManagerService {
	return &ManagerService{
		log:             log,
		chatProvider:    chatProvider,
		channelProvider: channelProvider,
	}
}

func (managerService *ManagerService) CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (string, error) {
	const op = "services.chat.CreateChat"

	log := managerService.log.With(slog.String("op", op))
	log.Info("creating chat")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return "", handleServiceError(err, op, "get user_id from context", log)
	}

	log.Debug("checking request body")
	if !utils.Contains(allowedChatTypes, chatType) {
		return "", handleServiceError(domain.ErrInvalidChatType, op, "check request body", log)
	}

	// TODO: улучшить проверку
	if chatType == "private" {
		if len(user_ids) != 1 {
			return "", handleServiceError(domain.ErrInvalidUserCountPrivateChat, op, "check private chat input", log)
		}
		if user_ids[0] == userID {
			return "", handleServiceError(domain.ErrSameUser, op, "check private chat input", log)
		}
	} else if name == "" {
		return "", handleServiceError(domain.ErrEmptyGroupName, op, "check group chat input", log)

	}

	user_ids = append(user_ids, userID)
	user_ids = utils.UniqueStrings(user_ids)

	log.Debug("checking if chat already exists")
	if existingChat, _ := managerService.chatProvider.FindChat(ctx, user_ids); existingChat != nil && chatType == "private" {
		return "", handleServiceError(domain.ErrChatExists, op, "check chat existence", log)
	}

	newChat := domain.Chat{
		MemberIDs:  user_ids,
		ChannelIDs: []string{},
		Type:       chatType,
	}

	if chatType == "group" {
		newChat.Name = name
	}

	log.Debug("saving chat")
	chatID, err := managerService.chatProvider.SaveChat(ctx, newChat)
	if err != nil {
		return "", handleServiceError(err, op, "save chat", log)

	}

	mainCh := domain.Channel{
		ChatID:     chatID,
		Name:       "Main",
		Type:       "text",
		MessageIDs: []string{},
	}

	log.Debug("saving main channel")
	if _, err = managerService.channelProvider.SaveChannel(ctx, mainCh); err != nil {
		return "", handleServiceError(err, op, "save main channel", log)
	}

	log.Info("chat created successfully")
	return chatID, nil
}

func (managerService *ManagerService) CreateChannel(ctx context.Context, chatID string, name string, chanType string) (string, error) {
	const op = "services.channel.CreateChannel"

	log := managerService.log.With(slog.String("op", op))
	log.Info("creating channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return "", handleServiceError(err, op, "get user_id from context", log)

	}

	log.Debug("finding chat by id")
	chat, err := managerService.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		return "", handleServiceError(err, op, "find chat by id", log)
	}

	// TODO: логика для voice и для text
	log.Debug("checking request body")
	if !utils.Contains(allowedChannelTypes, chanType) {
		return "", handleServiceError(domain.ErrInvalidChannelType, op, "check request body", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(chat.MemberIDs, userID) {
		return "", handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	newCh := domain.Channel{
		ChatID:     chatID,
		Name:       name,
		Type:       chanType,
		MessageIDs: []string{},
	}

	log.Debug("saving channel")
	channelID, err := managerService.channelProvider.SaveChannel(ctx, newCh)
	if err != nil {
		return "", handleServiceError(err, op, "save channel", log)
	}

	log.Info("channel created successfully")
	return channelID, nil
}
