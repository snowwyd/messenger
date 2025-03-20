package chat

import (
	"context"
	"errors"

	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/lib/logger"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Chat interface {
	CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (chatID string, err error)
	GetUserChats(ctx context.Context, chatType string) (chatPreviews []*msgv1chat.ChatPreview, err error)
	GetChatInfo(ctx context.Context, chatID string) (ID string, chatType string, name string, memberIDs []string, channels []*msgv1chat.Channel, err error)

	CreateChannel(ctx context.Context, chatID string, name string, chanType string) (channelID string, err error)

	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) (messages []*msgv1chat.Message, err error)
	SendMessage(ctx context.Context, channelID string, text string) (messageID string, err error)

	// Bidirectional streaming
	SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*msgv1chat.ChatStreamResponse)) error
}

type serverAPI struct {
	msgv1chat.UnimplementedConversationServer
	chat Chat
}

const (
	emptyValue = 0
)

func Register(gRPC *grpc.Server, chat Chat) {
	msgv1chat.RegisterConversationServer(gRPC, &serverAPI{chat: chat})
}

// CREATE METHODS
// CreateChat creates Chat
func (s *serverAPI) CreateChat(ctx context.Context, req *msgv1chat.CreateChatRequest) (*msgv1chat.CreateChatResponse, error) {
	if err := validateCreateChat(req); err != nil {
		return nil, err
	}

	ChatID, err := s.chat.CreateChat(ctx, req.GetType(), req.GetName(), req.GetUserIds())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.CreateChatResponse{
		ChatId: ChatID,
	}, nil
}

// CreateChannel returns channel id and creates channel in selected Chat with Name, and Type
func (s *serverAPI) CreateChannel(ctx context.Context, req *msgv1chat.CreateChannelRequest) (*msgv1chat.CreateChannelResponse, error) {
	if err := validateCreateChannel(req); err != nil {
		return nil, err
	}

	channelID, err := s.chat.CreateChannel(ctx, req.GetChatId(), req.GetName(), req.GetType())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.CreateChannelResponse{
		ChannelId: channelID,
	}, nil
}

// SendMessage returns message_id and sends message
func (s *serverAPI) SendMessage(ctx context.Context, req *msgv1chat.SendMessageRequest) (*msgv1chat.SendMessageResponse, error) {
	if err := validateSendMessage(req); err != nil {
		return nil, err
	}

	messageID, err := s.chat.SendMessage(ctx, req.GetChannelId(), req.GetText())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.SendMessageResponse{
		MessageId: messageID,
	}, nil
}

// GETTER METHODS
// GetUserChats returns slice of Chat previews of current user (from token)
func (s *serverAPI) GetUserChats(ctx context.Context, req *msgv1chat.GetUserChatsRequest) (*msgv1chat.GetUserChatsResponse, error) {
	if err := validateGetUserChats(req); err != nil {
		return nil, err
	}

	ChatPrews, err := s.chat.GetUserChats(ctx, req.GetType())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.GetUserChatsResponse{
		Chats: ChatPrews,
	}, nil
}

// GetChatInfo returns Chat name and slice of Channels
func (s *serverAPI) GetChatInfo(ctx context.Context, req *msgv1chat.GetChatInfoRequest) (*msgv1chat.GetChatInfoResponse, error) {
	if err := validateGetChatInfo(req); err != nil {
		return nil, err
	}

	ChatID, chatType, name, memberIDs, channels, err := s.chat.GetChatInfo(ctx, req.GetChatId())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.GetChatInfoResponse{
		ChatId:    ChatID,
		Type:      chatType,
		Name:      name,
		MemberIds: memberIDs,
		Channels:  channels,
	}, nil
}

// GetMessages returns slice of Messages from selected channel with limit and offset
func (s *serverAPI) GetMessages(ctx context.Context, req *msgv1chat.GetMessagesRequest) (*msgv1chat.GetMessagesResponse, error) {
	if err := validateGetMessages(req); err != nil {
		return nil, err
	}

	messages, err := s.chat.GetMessages(ctx, req.GetChannelId(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.GetMessagesResponse{
		Messages: messages,
	}, nil
}

// ChatStream для bidirectional streaming
func (s *serverAPI) ChatStream(req *msgv1chat.ChatStreamRequest, stream msgv1chat.Conversation_ChatStreamServer) error {
	// TODO: Валидация входных данных

	// Получение userID из контекста
	userID, err := GetUserIDFromContext(stream.Context())
	if err != nil {
		return status.Error(codes.Unauthenticated, "failed to get user_id from context")
	}

	// Вызов сервисного слоя для подписки на события канала
	err = s.chat.SubscribeToChannelEvents(stream.Context(), req.GetChannelId(), userID, func(event *msgv1chat.ChatStreamResponse) {
		// Отправка события клиенту через стрим
		if err := stream.Send(event); err != nil {
			logger.Err(err)
		}
	})
	if err != nil {
		return status.Error(codes.Internal, "failed to subscribe to channel events")
	}

	return nil
}

func GetUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return "", errors.New("failed to get user_id from context")
	}
	return userID, nil
}

func validateCreateChat(req *msgv1chat.CreateChatRequest) error {
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "chat_type is required")
	}
	return nil
}

func validateGetChatInfo(req *msgv1chat.GetChatInfoRequest) error {
	if req.GetChatId() == "" {
		return status.Error(codes.InvalidArgument, "chat_id is required")
	}
	return nil
}

func validateCreateChannel(req *msgv1chat.CreateChannelRequest) error {
	if req.GetChatId() == "" {
		return status.Error(codes.InvalidArgument, "chat_id is required")
	}
	if req.GetName() == "" {
		return status.Error(codes.InvalidArgument, "name is required")
	}
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "channel_type is required")
	}
	return nil
}

func validateGetMessages(req *msgv1chat.GetMessagesRequest) error {
	if req.GetChannelId() == "" {
		return status.Error(codes.InvalidArgument, "channel_id is required")
	}

	if req.GetLimit() == emptyValue {
		return status.Error(codes.InvalidArgument, "limit is required")
	}

	if req.GetOffset() == emptyValue {
		return status.Error(codes.InvalidArgument, "offset is required")
	}
	return nil
}

func validateSendMessage(req *msgv1chat.SendMessageRequest) error {
	if req.GetChannelId() == "" {
		return status.Error(codes.InvalidArgument, "channel_id is required")
	}

	if len(req.GetText()) == emptyValue {
		return status.Error(codes.InvalidArgument, "message text is required")
	}
	return nil
}

func validateGetUserChats(req *msgv1chat.GetUserChatsRequest) error {
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "chat type is required")
	}
	return nil

}
