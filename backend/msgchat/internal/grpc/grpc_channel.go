package grpccontroller

import (
	"context"
	"errors"

	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"github.com/snowwyd/messenger/msgchat/internal/lib/logger"
	"github.com/snowwyd/messenger/msgchat/internal/lib/utils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Channel interface {
	CreateChannel(ctx context.Context, chatID string, name string, chanType string) (channelID string, err error)
	// Server streaming
	SubscribeToChannelEvents(ctx context.Context, channelID string, userID string, sendEvent func(*msgv1chat.ChatStreamResponse)) error
}

// CreateChannel returns channel id and creates channel in selected Chat with Name, and Type
func (s *serverAPI) CreateChannel(ctx context.Context, req *msgv1chat.CreateChannelRequest) (*msgv1chat.CreateChannelResponse, error) {
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

	return &msgv1chat.CreateChannelResponse{
		ChannelId: channelID,
	}, nil
}

// ChatStream для bidirectional streaming
func (s *serverAPI) ChatStream(req *msgv1chat.ChatStreamRequest, stream msgv1chat.Conversation_ChatStreamServer) error {
	// TODO: Валидация входных данных

	// Получение userID из контекста
	userID, err := utils.GetUserIDFromContext(stream.Context())
	if err != nil {
		return status.Error(codes.Unauthenticated, "failed to get user_id from context")
	}

	// Вызов сервисного слоя для подписки на события канала
	err = s.channel.SubscribeToChannelEvents(stream.Context(), req.GetChannelId(), userID, func(event *msgv1chat.ChatStreamResponse) {
		// Отправка события клиенту через стрим
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
