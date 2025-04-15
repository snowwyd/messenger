package grpccontroller

import (
	"context"
	"errors"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Chat interface {
	CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (chatID string, err error)
	GetUserChats(ctx context.Context, chatType string) (chatPreviews []*chatpb.ChatPreview, err error)
	GetChatInfo(ctx context.Context, chatID string) (chatInfo domain.ChatInfo, err error)
}

func (s *serverAPI) CreateChat(ctx context.Context, req *chatpb.CreateChatRequest) (*chatpb.CreateChatResponse, error) {
	if err := validateCreateChat(req); err != nil {
		return nil, err
	}

	ChatID, err := s.chat.CreateChat(ctx, req.GetType(), req.GetName(), req.GetUserIds())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidChatType):
			return nil, status.Error(codes.InvalidArgument, "chat type must be only private or group")
		case errors.Is(err, domain.ErrInvalidUserCount):
			return nil, status.Error(codes.InvalidArgument, "private chat must contain only 2 users")
		case errors.Is(err, domain.ErrSameUser):
			return nil, status.Error(codes.InvalidArgument, "cannot create private chat with yourself")
		case errors.Is(err, domain.ErrEmptyGroupName):
			return nil, status.Error(codes.InvalidArgument, "group name must be not empty")
		case errors.Is(err, domain.ErrChatExists):
			return nil, status.Error(codes.AlreadyExists, "chat already exists")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &chatpb.CreateChatResponse{
		ChatId: ChatID,
	}, nil
}

func (s *serverAPI) GetUserChats(ctx context.Context, req *chatpb.GetUserChatsRequest) (*chatpb.GetUserChatsResponse, error) {
	if err := validateGetUserChats(req); err != nil {
		return nil, err
	}

	ChatPrews, err := s.chat.GetUserChats(ctx, req.GetType())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidChatType):
			return nil, status.Error(codes.InvalidArgument, "chat type must be only private or group")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &chatpb.GetUserChatsResponse{
		Chats: ChatPrews,
	}, nil
}

func (s *serverAPI) GetChatInfo(ctx context.Context, req *chatpb.GetChatInfoRequest) (*chatpb.GetChatInfoResponse, error) {
	if err := validateGetChatInfo(req); err != nil {
		return nil, err
	}

	chatInfo, err := s.chat.GetChatInfo(ctx, req.GetChatId())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrAccessDenied):
			return nil, status.Error(codes.PermissionDenied, "you don't have acces to this chat")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &chatpb.GetChatInfoResponse{
		ChatId:    chatInfo.ID,
		Type:      chatInfo.Type,
		Name:      chatInfo.Name,
		MemberIds: chatInfo.MemberIDs,
		Channels:  chatInfo.ProtoChannels,
	}, nil
}

func validateCreateChat(req *chatpb.CreateChatRequest) error {
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "chat_type is required")
	}
	return nil
}

func validateGetChatInfo(req *chatpb.GetChatInfoRequest) error {
	if req.GetChatId() == "" {
		return status.Error(codes.InvalidArgument, "chat_id is required")
	}
	return nil
}

func validateGetUserChats(req *chatpb.GetUserChatsRequest) error {
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "chat type is required")
	}
	return nil

}
