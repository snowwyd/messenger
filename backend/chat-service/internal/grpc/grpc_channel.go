package grpccontroller

import (
	"context"
	"errors"

	chatpb "chat-service/gen"
	"chat-service/internal/domain"
	"chat-service/internal/lib/logger"
	"chat-service/internal/lib/utils"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Channel interface {
	CreateChannel(ctx context.Context, chatID string, name string, chanType string) (channelID string, err error)
	SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*chatpb.ChatStreamResponse)) error
}

func (s *serverAPI) CreateChannel(ctx context.Context, req *chatpb.CreateChannelRequest) (*chatpb.CreateChannelResponse, error) {
	if err := validateCreateChannel(req); err != nil {
		return nil, err
	}

	channelID, err := s.channel.CreateChannel(ctx, req.GetChatId(), req.GetName(), req.GetType())
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrChatNotFound):
			return nil, status.Error(codes.NotFound, "chat not found")
		case errors.Is(err, domain.ErrAccessDenied):
			return nil, status.Error(codes.PermissionDenied, "user is not in this chat")
		case errors.Is(err, domain.ErrInvalidChannelType):
			return nil, status.Error(codes.InvalidArgument, "invalid channel type")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &chatpb.CreateChannelResponse{
		ChannelId: channelID,
	}, nil
}

func (s *serverAPI) ChatStream(req *chatpb.ChatStreamRequest, stream chatpb.Conversation_ChatStreamServer) error {
	// TODO: Валидация входных данных

	userID, err := utils.GetUserIDFromContext(stream.Context())
	if err != nil {
		return status.Error(codes.Unauthenticated, "failed to get user_id from context")
	}

	err = s.channel.SubscribeToChannelEvents(stream.Context(), req.GetChannelId(), userID, func(event *chatpb.ChatStreamResponse) {
		if err := stream.Send(event); err != nil {
			logger.Err(err)
		}
	})
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrChannelNotFound):
			return status.Error(codes.NotFound, "channel not found")
		case errors.Is(err, domain.ErrChatNotFound):
			return status.Error(codes.NotFound, "chat not found")
		case errors.Is(err, domain.ErrAccessDenied):
			return status.Error(codes.PermissionDenied, "user is not in this chat")
		default:
			return nil
		}
	}

	return nil
}

func validateCreateChannel(req *chatpb.CreateChannelRequest) error {
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
