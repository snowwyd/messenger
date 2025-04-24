package services

import (
	"context"
	"log/slog"

	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/mapper"
	"chat-service/internal/lib/utils"

	chatpb "chat-service/gen"
)

type Chat struct {
	log             *slog.Logger
	chatProvider    interfaces.ChatProvider
	channelProvider interfaces.ChannelProvider
}

func NewChatService(log *slog.Logger, chatProvider interfaces.ChatProvider, channelProvider interfaces.ChannelProvider) *Chat {
	return &Chat{
		log:             log,
		chatProvider:    chatProvider,
		channelProvider: channelProvider,
	}
}

var (
	allowedChatTypes = []string{"private", "group"}
)

func (c *Chat) CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (string, error) {
	const op = "services.chat.CreateChat"

	log := c.log.With(slog.String("op", op))
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
	if existingChat, _ := c.chatProvider.FindChat(ctx, user_ids); existingChat != nil && chatType == "private" {
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
	chatID, err := c.chatProvider.SaveChat(ctx, newChat)
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
	if _, err = c.channelProvider.SaveChannel(ctx, mainCh); err != nil {
		return "", handleServiceError(err, op, "save main channel", log)
	}

	log.Info("chat created successfully")
	return chatID, nil
}

func (c *Chat) GetUserChats(ctx context.Context, chatType string) ([]*chatpb.ChatPreview, error) {
	const op = "services.chat.GetUserChats"

	log := c.log.With(slog.String("op", op))
	log.Info("getting user chats")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, handleServiceError(err, op, "get user_id from context", log)
	}

	log.Debug("checking request body")
	if !utils.Contains(allowedChatTypes, chatType) {
		return nil, handleServiceError(domain.ErrInvalidChatType, op, "check request body", log)
	}

	// TODO: add main channel id here
	log.Debug("getting users chats")
	chatPreviews, err := c.chatProvider.FindUserChats(ctx, userID, chatType)
	if err != nil {
		return nil, handleServiceError(err, op, "get user chats", log)

	}

	protoChatPreviews := mapper.ConvertChatPreviewsToProto(chatPreviews)

	log.Info("chat previews got successfully")
	return protoChatPreviews, nil
}

func (c *Chat) GetChatInfo(ctx context.Context, chatID string) (chatInfo domain.ChatInfo, err error) {
	const op = "services.chat.GetChatInfo"

	log := c.log.With(slog.String("op", op))
	log.Info("getting user chats")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return domain.ChatInfo{}, handleServiceError(err, op, "get user_id from context", log)

	}

	log.Debug("finding chat by id")
	chat, err := c.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		return domain.ChatInfo{}, handleServiceError(err, op, "get chat by id", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(chat.MemberIDs, userID) {
		return domain.ChatInfo{}, handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	log.Debug("getting channels info")
	channels, err := c.channelProvider.FindChannelsByIDs(ctx, chat.ChannelIDs)
	if err != nil {
		return domain.ChatInfo{}, handleServiceError(err, op, "get channels info", log)

	}
	protoChannels := mapper.ConvertChannelsToProto(channels)

	chatInfo = domain.ChatInfo{
		ID:            chat.ID,
		Type:          chat.Type,
		Name:          chat.Name,
		MemberIDs:     chat.MemberIDs,
		ProtoChannels: protoChannels,
	}

	log.Info("chat info got successfully")
	return chatInfo, nil
}
