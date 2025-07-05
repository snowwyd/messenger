package interfaces

import (
	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"context"
)

type ConversationService interface {
	SubscribeToChannelEvents(ctx context.Context, channelID, userID string, sendEvent func(*chatpb.ChatStreamResponse)) error
	SendMessage(ctx context.Context, channelID, text string) (string, error)
}

type ViewService interface {
	GetUserChats(ctx context.Context, chatType string) ([]*chatpb.ChatPreview, error)
	GetChatInfo(ctx context.Context, chatID string) (chatInfo domain.ChatInfo, err error)
	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*chatpb.Message, error)
}

type ManagerService interface {
	CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (string, error)
	CreateChannel(ctx context.Context, chatID string, name string, chanType string) (string, error)
}
