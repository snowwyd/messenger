package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"chat-service/internal/domain/interfaces"
	"chat-service/internal/lib/logger"
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

func (c *Channel) SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*chatpb.ChatStreamResponse)) error {
	const op = "services.chat.SubscribeToChannelEvents"

	log := c.log.With(slog.String("op", op), slog.String("channel_id", channelID), slog.String("user_id", userID))
	log.Info("subscribing to channel events")

	if err := c.channelValidation(ctx, log, channelID, userID); err != nil {
		log.Error("failed channel validation", logger.Err(err))
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
	const op = "services.chat.CreateChannel"

	log := c.log.With(slog.String("op", op))
	log.Info("creating channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("finding chat by id")
	chat, err := c.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrChatNotFound) {
			log.Error("chat not found", logger.Err(domain.ErrChatNotFound))
			return "", fmt.Errorf("%s: %w", op, domain.ErrChatNotFound)
		}
		log.Error("failed to get chat by id", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	// TODO: логика для voice и для text
	log.Debug("checking request body")
	if !utils.Contains(allowedChannelTypes, chanType) {
		log.Error("invalid channel type", logger.Err(domain.ErrInvalidChannelType))
		return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidChannelType)
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(chat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(domain.ErrAccessDenied))
		return "", fmt.Errorf("%s: %w", op, domain.ErrAccessDenied)
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
		log.Error("failed to save channel", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Info("channel created successfully")
	return channelID, nil
}

func (c *Channel) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
	log.Debug("checking if channel exists")
	existingChannel, err := c.channelProvider.FindChannelByID(ctx, channelID)
	if err != nil {
		if errors.Is(err, domain.ErrChannelNotFound) {
			log.Error("channel not found", logger.Err(domain.ErrChannelNotFound))
			return domain.ErrChannelNotFound
		}
		log.Error("failed to get channel by id", logger.Err(err))
		return err
	}

	log.Debug("checking if chat exists")
	existingChat, err := c.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrChatNotFound) {
			log.Error("chat not found", logger.Err(domain.ErrChatNotFound))
			return domain.ErrChatNotFound
		}
		log.Error("failed to get chat by id", logger.Err(err))
		return err
	}

	log.Debug("checking if user in this chat")
	if !utils.Contains(existingChat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(domain.ErrAccessDenied))
		return domain.ErrAccessDenied
	}

	return nil
}
