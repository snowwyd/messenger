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
	"sync"
	"time"
)

type ConversationService struct {
	log              *slog.Logger
	chatProvider     interfaces.ChatProvider
	channelProvider  interfaces.ChannelProvider
	messageProvider  interfaces.MessageProvider
	maxMessageLength int

	subscriptions map[string][]chan *chatpb.ChatStreamResponse
	mu            sync.Mutex
}

func NewConversationService(
	log *slog.Logger,
	chatProvider interfaces.ChatProvider,
	channelProvider interfaces.ChannelProvider,
	messageProvider interfaces.MessageProvider,
	maxMessageLength int,
) *ConversationService {
	return &ConversationService{
		log:              log,
		chatProvider:     chatProvider,
		channelProvider:  channelProvider,
		messageProvider:  messageProvider,
		maxMessageLength: maxMessageLength,

		subscriptions: make(map[string][]chan *chatpb.ChatStreamResponse),
	}
}

func (conversationService *ConversationService) SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*chatpb.ChatStreamResponse)) error {
	const op = "services.conversationService.SubscribeToChannelEvents"

	log := conversationService.log.With(slog.String("op", op), slog.String("channel_id", channelID), slog.String("user_id", userID))
	log.Info("subscribing to channel events")

	if err := conversationService.channelValidation(ctx, log, channelID, userID); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	subscriberChan := make(chan *chatpb.ChatStreamResponse)

	log.Debug("adding subscriber to subscription list")
	conversationService.mu.Lock()
	if _, exists := conversationService.subscriptions[channelID]; !exists {
		conversationService.subscriptions[channelID] = []chan *chatpb.ChatStreamResponse{}
	}
	conversationService.subscriptions[channelID] = append(conversationService.subscriptions[channelID], subscriberChan)
	conversationService.mu.Unlock()

	defer func() {
		log.Debug("removing subscriber from subscription list")
		conversationService.mu.Lock()
		for i, ch := range conversationService.subscriptions[channelID] {
			if ch == subscriberChan {
				conversationService.subscriptions[channelID] = append(conversationService.subscriptions[channelID][:i], conversationService.subscriptions[channelID][i+1:]...)
				break
			}
		}
		close(subscriberChan)
		conversationService.mu.Unlock()
	}()

	for {
		select {
		case <-ctx.Done():
			log.Info("client disconnected or context canceled")
			return nil

		case event := <-subscriberChan:
			sendEvent(event)
		}
	}
}

func (conversationService *ConversationService) SendMessage(ctx context.Context, channelID string, text string) (string, error) {
	const op = "services.conversationService.SendMessage"

	log := conversationService.log.With(slog.String("op", op), slog.String("channel_id", channelID))
	log.Info("sending message")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return "", handleServiceError(err, op, "get user_id from context", log)
	}

	if err := conversationService.channelValidation(ctx, log, channelID, userID); err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("vaildating request body")
	if len(text) > conversationService.maxMessageLength {
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
	if newMessage.ID, err = conversationService.messageProvider.SaveMessage(ctx, newMessage); err != nil {
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
	conversationService.mu.Lock()
	subscribers := conversationService.subscriptions[channelID]
	for _, subscriber := range subscribers {
		select {
		case subscriber <- event:
		default:
			log.Warn("failed to send event to subscriber", slog.String("channel_id", channelID))
		}
	}
	conversationService.mu.Unlock()

	log.Info("message sent successfully", slog.String("message_id", newMessage.ID))
	return newMessage.ID, nil
}

func (m *ConversationService) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
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
