package grpccontroller

import (
	"context"
	"errors"

	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Message interface {
	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) (messages []*msgv1chat.Message, err error)
	SendMessage(ctx context.Context, channelID string, text string) (messageID string, err error)
}

// SendMessage returns message_id and sends message
func (s *serverAPI) SendMessage(ctx context.Context, req *msgv1chat.SendMessageRequest) (*msgv1chat.SendMessageResponse, error) {
	if err := validateSendMessage(req); err != nil {
		return nil, err
	}

	messageID, err := s.message.SendMessage(ctx, req.GetChannelId(), req.GetText())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrChannelNotFound):
			return nil, status.Error(codes.NotFound, "channel not found")
		case errors.Is(err, domain.ErrChatNotFound):
			return nil, status.Error(codes.NotFound, "chat not found")
		case errors.Is(err, domain.ErrAccessDenied):
			return nil, status.Error(codes.PermissionDenied, "user is not in this chat")
		case errors.Is(err, domain.ErrInvalidMessage):
			return nil, status.Error(codes.InvalidArgument, "invalid message length")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &msgv1chat.SendMessageResponse{
		MessageId: messageID,
	}, nil
}

// GetMessages returns slice of Messages from selected channel with limit and offset
func (s *serverAPI) GetMessages(ctx context.Context, req *msgv1chat.GetMessagesRequest) (*msgv1chat.GetMessagesResponse, error) {
	if err := validateGetMessages(req); err != nil {
		return nil, err
	}

	messages, err := s.message.GetMessages(ctx, req.GetChannelId(), req.GetLimit(), req.GetOffset())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrChannelNotFound):
			return nil, status.Error(codes.NotFound, "channel not found")
		case errors.Is(err, domain.ErrChatNotFound):
			return nil, status.Error(codes.NotFound, "chat not found")
		case errors.Is(err, domain.ErrAccessDenied):
			return nil, status.Error(codes.PermissionDenied, "user is not in this chat")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &msgv1chat.GetMessagesResponse{
		Messages: messages,
	}, nil
}

func validateSendMessage(req *msgv1chat.SendMessageRequest) error {
	if req.GetChannelId() == "" {
		return status.Error(codes.InvalidArgument, "channel_id is required")
	}

	if len(req.GetText()) == 0 {
		return status.Error(codes.InvalidArgument, "message text is required")
	}
	return nil
}

func validateGetMessages(req *msgv1chat.GetMessagesRequest) error {
	if req.GetChannelId() == "" {
		return status.Error(codes.InvalidArgument, "channel_id is required")
	}

	if req.GetLimit() == 0 {
		return status.Error(codes.InvalidArgument, "limit is required")
	}

	if req.GetOffset() == 0 {
		return status.Error(codes.InvalidArgument, "offset is required")
	}
	return nil
}
