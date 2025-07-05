package services

import (
	"context"
	"fmt"
	"log/slog"
	"sync"
	"time"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/mapper"
	"chat-service/internal/lib/utils"
)

type Message struct {
	log              *slog.Logger
	chatProvider     interfaces.ChatProvider
	channelProvider  interfaces.ChannelProvider
	messageProvider  interfaces.MessageProvider
	maxMessageLength int

	subscriptions map[string][]chan *chatpb.ChatStreamResponse
	mu            sync.Mutex
}

func NewMessageService(log *slog.Logger, chatProvider interfaces.ChatProvider, channelProvider interfaces.ChannelProvider, messageProvider interfaces.MessageProvider, maxMessageLength int) *Message {
	return &Message{
		log:              log,
		chatProvider:     chatProvider,
		channelProvider:  channelProvider,
		messageProvider:  messageProvider,
		maxMessageLength: maxMessageLength,

		subscriptions: make(map[string][]chan *chatpb.ChatStreamResponse),
	}
}

func (m *Message) SendMessage(ctx context.Context, channelID string, text string) (string, error) {
	const op = "services.message.SendMessage"

	log := m.log.With(slog.String("op", op), slog.String("channel_id", channelID))
	log.Info("sending message")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return "", handleServiceError(err, op, "get user_id from context", log)
	}

	if err := m.channelValidation(ctx, log, channelID, userID); err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("vaildating request body")
	if len(text) > m.maxMessageLength {
		return "", handleServiceError(err, op, "validate request body", log)
	}

	createdAt := time.Now()
	newMessage := domain.Message{
		ChannelID: channelID,
		Text:      text,
		SenderID:  userID,
		CreatedAt: createdAt,
	}

	log.Debug("saving message")
	if newMessage.ID, err = m.messageProvider.SaveMessage(ctx, newMessage); err != nil {
		return "", handleServiceError(err, op, "save message", log)
	}

	protoMessage := mapper.ConvertMessageToProto(&newMessage)

	log.Debug("adding new message event")
	event := &chatpb.ChatStreamResponse{
		Payload: &chatpb.ChatStreamResponse_NewMessage{
			NewMessage: protoMessage,
		},
	}

	log.Debug("publishing event")
	m.mu.Lock()
	subscribers := m.subscriptions[channelID]
	for _, subscriber := range subscribers {
		select {
		case subscriber <- event:
		default:
			log.Warn("failed to send event to subscriber", slog.String("channel_id", channelID))
		}
	}
	m.mu.Unlock()

	log.Info("message sent successfully", slog.String("message_id", newMessage.ID))
	return newMessage.ID, nil
}

func (m *Message) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*chatpb.Message, error) {
	const op = "services.message.GetMessages"

	log := m.log.With(slog.String("op", op))
	log.Info("getting messages from channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, handleServiceError(err, op, "get user_id from context", log)

	}

	if err := m.channelValidation(ctx, log, channelID, userID); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("getting messages from channel")
	messages, err := m.messageProvider.GetMessages(ctx, channelID, limit, offset)
	if err != nil {
		return nil, handleServiceError(err, op, "get messages from channel", log)
	}
	protoMessages := mapper.ConvertMessagesToProto(messages)

	log.Info("messages got successfully")
	return protoMessages, nil
}

func (m *Message) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
	const op = "services.message.channelValidation"

	log.Debug("checking if channel exists")
	existingChannel, err := m.channelProvider.FindChannelByID(ctx, channelID)
	if err != nil {
		return handleServiceError(err, op, "check channel existence", log)
	}

	log.Debug("checking if chat exists")
	existingChat, err := m.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if err != nil {
		return handleServiceError(err, op, "check chat existence", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(existingChat.MemberIDs, userID) {
		return handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	return nil
}
