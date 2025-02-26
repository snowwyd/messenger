package chat

import (
	"context"

	msgv1chat "github.com/snowwyd/protos/gen/go/messenger/msgchat"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Chat interface {
	SendMessage(ctx context.Context, senderID string, chatID string, text string) (messageID string, err error)
	GetMessages(ctx context.Context, chatID string, limit int32, offset int32) (messages []*msgv1chat.Message, err error)
	CreateChat(ctx context.Context, userIDs []string) (chatID string, err error)
	GetUserChats(ctx context.Context, userID string) (chats []*msgv1chat.ChatInfo, err error)
	DeleteMessage(ctx context.Context, messageID string) (success bool, err error)
}

type serverAPI struct {
	msgv1chat.UnimplementedChatServer
	chat Chat
}

const (
	emptyValue = 0
)

func Register(gRPC *grpc.Server, chat Chat) {
	msgv1chat.RegisterChatServer(gRPC, &serverAPI{chat: chat})
}

func (s *serverAPI) SendMessage(ctx context.Context, req *msgv1chat.SendMessageRequest) (*msgv1chat.SendMessageResponse, error) {
	if err := validateSendMessage(req); err != nil {
		return nil, err
	}

	messageID, err := s.chat.SendMessage(ctx, req.GetSenderId(), req.GetChatId(), req.GetText())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.SendMessageResponse{
		MessageId: messageID,
	}, nil
}

func (s *serverAPI) GetMessages(ctx context.Context, req *msgv1chat.GetMessagesRequest) (*msgv1chat.GetMessagesResponse, error) {
	if err := validateGetMessages(req); err != nil {
		return nil, err
	}

	messages, err := s.chat.GetMessages(ctx, req.GetChatId(), req.GetLimit(), req.GetOffset())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.GetMessagesResponse{
		Messages: messages,
	}, nil
}

func (s *serverAPI) CreateChat(ctx context.Context, req *msgv1chat.CreateChatRequest) (*msgv1chat.CreateChatResponse, error) {
	if err := validateCreateChat(req); err != nil {
		return nil, err
	}

	chatID, err := s.chat.CreateChat(ctx, req.GetUserIds())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1chat.CreateChatResponse{
		ChatId: chatID,
	}, nil
}

func (s *serverAPI) GetUserChats(ctx context.Context, req *msgv1chat.GetUserChatsRequest) (*msgv1chat.GetUserChatsResponse, error) {
	if err := validateGetUserChats(req); err != nil {
		return nil, err
	}

	chats, err := s.chat.GetUserChats(ctx, req.GetUserId())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	return &msgv1chat.GetUserChatsResponse{
		Chats: chats,
	}, nil
}

func (s *serverAPI) DeleteMessage(ctx context.Context, req *msgv1chat.DeleteMessageRequest) (*msgv1chat.DeleteMessageResponse, error) {
	if err := validateDeleteMessage(req); err != nil {
		return nil, err
	}

	success, err := s.chat.DeleteMessage(ctx, req.GetMessageId())
	if err != nil {
		return nil, status.Error(codes.Internal, "internal error")
	}
	return &msgv1chat.DeleteMessageResponse{
		Success: success,
	}, nil
}

func validateSendMessage(req *msgv1chat.SendMessageRequest) error {
	if req.GetChatId() == "" {
		return status.Error(codes.InvalidArgument, "chat_id is required")
	}
	if req.GetSenderId() == "" {
		return status.Error(codes.InvalidArgument, "sender_id is required")
	}
	return nil
}

func validateGetMessages(req *msgv1chat.GetMessagesRequest) error {
	if req.GetChatId() == "" {
		return status.Error(codes.InvalidArgument, "chat_id is required")
	}
	if req.GetLimit() == emptyValue {
		return status.Error(codes.InvalidArgument, "limit is required")
	}
	if req.GetOffset() == emptyValue {
		return status.Error(codes.InvalidArgument, "offset is required")
	}
	return nil
}

func validateCreateChat(req *msgv1chat.CreateChatRequest) error {
	if req.GetUserIds() == nil {
		return status.Error(codes.InvalidArgument, "user_ids are required")
	}
	return nil
}

func validateGetUserChats(req *msgv1chat.GetUserChatsRequest) error {
	if req.GetUserId() == "" {
		return status.Error(codes.InvalidArgument, "user_id is required")
	}
	return nil
}

func validateDeleteMessage(req *msgv1chat.DeleteMessageRequest) error {
	if req.GetMessageId() == "" {
		return status.Error(codes.InvalidArgument, "message_id is required")
	}
	return nil
}
