package grpccontroller

import (
	"context"
	"errors"

	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Chat interface {
	CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (chatID string, err error)
	GetUserChats(ctx context.Context, chatType string) (chatPreviews []*msgv1chat.ChatPreview, err error)
	GetChatInfo(ctx context.Context, chatID string) (chatInfo domain.ChatInfo, err error)
}

// CreateChat creates Chat
func (s *serverAPI) CreateChat(ctx context.Context, req *msgv1chat.CreateChatRequest) (*msgv1chat.CreateChatResponse, error) {
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

	return &msgv1chat.CreateChatResponse{
		ChatId: ChatID,
	}, nil
}

// GetUserChats returns slice of Chat previews of current user (from token)
func (s *serverAPI) GetUserChats(ctx context.Context, req *msgv1chat.GetUserChatsRequest) (*msgv1chat.GetUserChatsResponse, error) {
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

	return &msgv1chat.GetUserChatsResponse{
		Chats: ChatPrews,
	}, nil
}

// GetChatInfo returns Chat name and slice of Channels
func (s *serverAPI) GetChatInfo(ctx context.Context, req *msgv1chat.GetChatInfoRequest) (*msgv1chat.GetChatInfoResponse, error) {
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

	return &msgv1chat.GetChatInfoResponse{
		ChatId:    chatInfo.ID,
		Type:      chatInfo.Type,
		Name:      chatInfo.Name,
		MemberIds: chatInfo.MemberIDs,
		Channels:  chatInfo.ProtoChannels,
	}, nil
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

func validateGetUserChats(req *msgv1chat.GetUserChatsRequest) error {
	if req.GetType() == "" {
		return status.Error(codes.InvalidArgument, "chat type is required")
	}
	return nil

}
