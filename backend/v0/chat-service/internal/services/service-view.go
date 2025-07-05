package services

import (
	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/mapper"
	"chat-service/internal/lib/utils"
	"context"
	"fmt"
	"log/slog"
)

type ViewService struct {
	log             *slog.Logger
	chatProvider    interfaces.ChatProvider
	channelProvider interfaces.ChannelProvider
	messageProvider interfaces.MessageProvider
}

func NewViewService(
	log *slog.Logger,
	chatProvider interfaces.ChatProvider,
	channelProvider interfaces.ChannelProvider,
	messageProvider interfaces.MessageProvider,
) *ViewService {
	return &ViewService{
		log:             log,
		chatProvider:    chatProvider,
		channelProvider: channelProvider,
		messageProvider: messageProvider,
	}
}

func (viewService *ViewService) GetUserChats(ctx context.Context, chatType string) ([]*chatpb.ChatPreview, error) {
	const op = "services.viewService.GetUserChats"

	log := viewService.log.With(slog.String("op", op))
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
	chatPreviews, err := viewService.chatProvider.FindUserChats(ctx, userID, chatType)
	if err != nil {
		return nil, handleServiceError(err, op, "get user chats", log)

	}

	protoChatPreviews := mapper.ConvertChatPreviewsToProto(chatPreviews)

	log.Info("chat previews got successfully")
	return protoChatPreviews, nil
}

func (viewService *ViewService) GetChatInfo(ctx context.Context, chatID string) (chatInfo domain.ChatInfo, err error) {
	const op = "services.viewService.GetChatInfo"

	log := viewService.log.With(slog.String("op", op))
	log.Info("getting user chats")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return domain.ChatInfo{}, handleServiceError(err, op, "get user_id from context", log)

	}

	log.Debug("finding chat by id")
	chat, err := viewService.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		return domain.ChatInfo{}, handleServiceError(err, op, "get chat by id", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(chat.MemberIDs, userID) {
		return domain.ChatInfo{}, handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	log.Debug("getting channels info")
	channels, err := viewService.channelProvider.FindChannelsByIDs(ctx, chat.ChannelIDs)
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

func (viewService *ViewService) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*chatpb.Message, error) {
	const op = "services.viewService.GetMessages"

	log := viewService.log.With(slog.String("op", op))
	log.Info("getting messages from channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, handleServiceError(err, op, "get user_id from context", log)

	}

	if err := viewService.channelValidation(ctx, log, channelID, userID); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("getting messages from channel")
	messages, err := viewService.messageProvider.GetMessages(ctx, channelID, limit, offset)
	if err != nil {
		return nil, handleServiceError(err, op, "get messages from channel", log)
	}
	protoMessages := mapper.ConvertMessagesToProto(messages)

	log.Info("messages got successfully")
	return protoMessages, nil
}

func (viewService *ViewService) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
	const op = "services.viewService.channelValidation"

	log.Debug("checking if channel exists")
	existingChannel, err := viewService.channelProvider.FindChannelByID(ctx, channelID)
	if err != nil {
		return handleServiceError(err, op, "check channel existence", log)
	}

	log.Debug("checking if chat exists")
	existingChat, err := viewService.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if err != nil {
		return handleServiceError(err, op, "check chat existence", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(existingChat.MemberIDs, userID) {
		return handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	return nil
}
