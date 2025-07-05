package interfaces

import (
	"context"

	"chat-service/internal/domain"
)

type ChatProvider interface {
	SaveChat(ctx context.Context, chat domain.Chat) (chatID string, err error)
	FindChat(ctx context.Context, userIDs []string) (chat *domain.Chat, err error)
	FindChatByID(ctx context.Context, chatID string, userID string) (chat domain.Chat, err error)
	FindUserChats(ctx context.Context, userID string, chatType string) (chatPreviews []*domain.ChatPreview, err error)
}

type ChannelProvider interface {
	SaveChannel(ctx context.Context, channel domain.Channel) (chanID string, err error)
	FindChannelByID(ctx context.Context, channelID string) (channel domain.Channel, err error)

	FindChannelsByIDs(ctx context.Context, channelIDs []string) (channels []domain.Channel, err error)
}

type MessageProvider interface {
	SaveMessage(ctx context.Context, message domain.Message) (messageID string, err error)
	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) (messages []*domain.Message, err error)
}
