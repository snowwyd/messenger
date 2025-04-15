package services

import (
	"context"
	"fmt"
	"log/slog"

	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/logger"
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
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("checking request body")
	if !utils.Contains(allowedChatTypes, chatType) {
		log.Error("invalid chat type", logger.Err(domain.ErrInvalidChatType))
		return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidChatType)
	}

	// TODO: улучшить проверку
	if chatType == "private" {
		if len(user_ids) != 1 {
			log.Error("invalid input: private chat must contain only 1 user_id", logger.Err(domain.ErrInvalidUserCount))
			return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidUserCount)
		}
		if user_ids[0] == userID {
			log.Error("invalid input: private chat can be created only with another person", logger.Err(domain.ErrSameUser))
			return "", fmt.Errorf("%s: %w", op, domain.ErrSameUser)
		}
	} else if name == "" {
		log.Error("invalid input: group name must be not empty", logger.Err(domain.ErrEmptyGroupName))
		return "", fmt.Errorf("%s: %w", op, domain.ErrEmptyGroupName)
	}

	user_ids = append(user_ids, userID)
	user_ids = utils.UniqueStrings(user_ids)

	log.Debug("checking if chat already exists")
	if existingChat, _ := c.chatProvider.FindChat(ctx, user_ids); existingChat != nil && chatType == "private" {
		log.Warn("chat already exists!", logger.Err(domain.ErrChatExists))
		return "", fmt.Errorf("%s: %w", op, domain.ErrChatExists)
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
		log.Error("failed to save chat", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	mainCh := domain.Channel{
		ChatID:     chatID,
		Name:       "Main",
		Type:       "text",
		MessageIDs: []string{},
	}

	log.Debug("saving main channel")
	if _, err = c.channelProvider.SaveChannel(ctx, mainCh); err != nil {
		log.Error("failed to save chat", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
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
		log.Error("failed to get user_id from context", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("checking request body")
	if !utils.Contains(allowedChatTypes, chatType) {
		log.Error("invalid chat type", logger.Err(domain.ErrInvalidChatType))
		return nil, fmt.Errorf("%s: %w", op, domain.ErrInvalidChatType)
	}

	// TODO: add main channel id here
	log.Debug("getting users chats")
	chatPreviews, err := c.chatProvider.FindUserChats(ctx, userID, chatType)
	if err != nil {
		log.Error("faild to get chats", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
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
		log.Error("failed to get user_id from context", logger.Err(err))
		return domain.ChatInfo{}, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("finding chat by id")
	chat, err := c.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		log.Error("failed to get chat by id", logger.Err(err))
		return domain.ChatInfo{}, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(chat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(domain.ErrAccessDenied))
		return domain.ChatInfo{}, fmt.Errorf("%s: %w", op, domain.ErrAccessDenied)
	}

	log.Debug("getting channels info")
	channels, err := c.channelProvider.FindChannelsByIDs(ctx, chat.ChannelIDs)
	if err != nil {
		log.Error("failed to get channels", logger.Err(err))
		return domain.ChatInfo{}, fmt.Errorf("%s: %w", op, err)
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
