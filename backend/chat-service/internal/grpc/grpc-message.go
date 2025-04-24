package grpccontroller

import (
	"context"
	"errors"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// TODO: move to domain
type Message interface {
	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) (messages []*chatpb.Message, err error)
	SendMessage(ctx context.Context, channelID string, text string) (messageID string, err error)
}

func (s *serverAPI) SendMessage(ctx context.Context, req *chatpb.SendMessageRequest) (*chatpb.SendMessageResponse, error) {
	if err := validateSendMessage(req); err != nil {
		return nil, err
	}

	// TODO: implement error handler
	messageID, err := s.conversationService.SendMessage(ctx, req.GetChannelId(), req.GetText())
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

	return &chatpb.SendMessageResponse{
		MessageId: messageID,
	}, nil
}

func (s *serverAPI) GetMessages(ctx context.Context, req *chatpb.GetMessagesRequest) (*chatpb.GetMessagesResponse, error) {
	if err := validateGetMessages(req); err != nil {
		return nil, err
	}

	// TODO: implement error handler
	messages, err := s.viewService.GetMessages(ctx, req.GetChannelId(), req.GetLimit(), req.GetOffset())
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

	return &chatpb.GetMessagesResponse{
		Messages: messages,
	}, nil
}

// TODO: implement error handler
func validateSendMessage(req *chatpb.SendMessageRequest) error {
	if req.GetChannelId() == "" {
		return status.Error(codes.InvalidArgument, "channel_id is required")
	}

	if len(req.GetText()) == 0 {
		return status.Error(codes.InvalidArgument, "message text is required")
	}
	return nil
}

// TODO: implement error handler
func validateGetMessages(req *chatpb.GetMessagesRequest) error {
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
