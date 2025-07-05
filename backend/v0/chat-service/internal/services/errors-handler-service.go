package services

import (
	"chat-service/internal/domain"
	"chat-service/internal/lib/logger"
	"errors"
	"fmt"
	"log/slog"
)

func handleServiceError(err error, op, defaultLogText string, log *slog.Logger) error {
	switch {
	case errors.Is(err, domain.ErrAccessDenied):
		log.Error("user has no access", logger.Err(domain.ErrAccessDenied))
		return fmt.Errorf("%s: %w", op, domain.ErrAccessDenied)

	case errors.Is(err, domain.ErrChatNotFound):
		log.Error("chat not found", logger.Err(domain.ErrChatNotFound))
		return fmt.Errorf("%s: %w", op, domain.ErrChatNotFound)
	case errors.Is(err, domain.ErrChannelNotFound):
		log.Error("channel not found", logger.Err(domain.ErrChannelNotFound))
		return domain.ErrChannelNotFound

	case errors.Is(err, domain.ErrChatExists):
		log.Warn("chat already exists!", logger.Err(domain.ErrChatExists))
		return fmt.Errorf("%s: %w", op, domain.ErrChatExists)
	case errors.Is(err, domain.ErrInvalidChatType):
		log.Error("invalid chat type", logger.Err(domain.ErrInvalidChatType))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidChatType)
	case errors.Is(err, domain.ErrInvalidUserCountPrivateChat):
		log.Error("invalid input: private chat must contain only 1 user_id", logger.Err(domain.ErrInvalidUserCountPrivateChat))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidUserCountPrivateChat)
	case errors.Is(err, domain.ErrInvalidMessage):
		log.Error("invalid message length", logger.Err(domain.ErrInvalidMessage))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidMessage)

	case errors.Is(err, domain.ErrSameUser):
		log.Error("invalid input: private chat can be created only with another person", logger.Err(domain.ErrSameUser))
		return fmt.Errorf("%s: %w", op, domain.ErrSameUser)

	case errors.Is(err, domain.ErrEmptyGroupName):
		log.Error("invalid input: group name must be not empty", logger.Err(domain.ErrEmptyGroupName))
		return fmt.Errorf("%s: %w", op, domain.ErrEmptyGroupName)

	default:
		logString := fmt.Sprintf("failed to %s", defaultLogText)
		log.Warn(logString, logger.Err(err))
		return fmt.Errorf("%s: %w", op, err)
	}
}
