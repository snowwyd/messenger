package services

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/utils"
)

type Channel struct {
	log             *slog.Logger
	chatProvider    interfaces.ChatProvider
	channelProvider interfaces.ChannelProvider
	messageProvider interfaces.MessageProvider

	subscriptions map[string][]chan *chatpb.ChatStreamResponse
	mu            sync.Mutex
}

func NewChannelService(log *slog.Logger, chatProvider interfaces.ChatProvider, channelProvider interfaces.ChannelProvider, messageProvider interfaces.MessageProvider) *Channel {
	return &Channel{
		log:             log,
		chatProvider:    chatProvider,
		channelProvider: channelProvider,
		messageProvider: messageProvider,

		subscriptions: make(map[string][]chan *chatpb.ChatStreamResponse),
	}
}

var (
	allowedChannelTypes = []string{"voice", "text"}
)

// FIXME: not working!
func (c *Channel) SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*chatpb.ChatStreamResponse)) error {
	const op = "services.channel.SubscribeToChannelEvents"

	log := c.log.With(slog.String("op", op), slog.String("channel_id", channelID), slog.String("user_id", userID))
	log.Info("subscribing to channel events")

	if err := c.channelValidation(ctx, log, channelID, userID); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	subscriberChan := make(chan *chatpb.ChatStreamResponse)

	log.Debug("adding subscriber to subscription list")
	c.mu.Lock()
	if _, exists := c.subscriptions[channelID]; !exists {
		c.subscriptions[channelID] = []chan *chatpb.ChatStreamResponse{}
	}
	c.subscriptions[channelID] = append(c.subscriptions[channelID], subscriberChan)
	c.mu.Unlock()

	defer func() {
		log.Debug("removing subscriber from subscription list")
		c.mu.Lock()
		for i, ch := range c.subscriptions[channelID] {
			if ch == subscriberChan {
				c.subscriptions[channelID] = append(c.subscriptions[channelID][:i], c.subscriptions[channelID][i+1:]...)
				break
			}
		}
		close(subscriberChan)
		c.mu.Unlock()
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

func (c *Channel) CreateChannel(ctx context.Context, chatID string, name string, chanType string) (string, error) {
	const op = "services.channel.CreateChannel"

	log := c.log.With(slog.String("op", op))
	log.Info("creating channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		return "", handleServiceError(err, op, "get user_id from context", log)

	}

	log.Debug("finding chat by id")
	chat, err := c.chatProvider.FindChatByID(ctx, chatID, userID)
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
	channelID, err := c.channelProvider.SaveChannel(ctx, newCh)
	if err != nil {
		return "", handleServiceError(err, op, "save channel", log)
	}

	log.Info("channel created successfully")
	return channelID, nil
}

func (c *Channel) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
	const op = "services.channel.channelValidation"

	log.Debug("checking if channel exists")
	existingChannel, err := c.channelProvider.FindChannelByID(ctx, channelID)
	if err != nil {
		return handleServiceError(err, op, "check channel existence", log)
	}

	log.Debug("checking if chat exists")
	existingChat, err := c.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if err != nil {
		return handleServiceError(err, op, "check chat existence", log)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(existingChat.MemberIDs, userID) {
		return handleServiceError(domain.ErrAccessDenied, op, "check if user in this chat", log)
	}

	return nil
}
