package services

import (
	"errors"
	"fmt"
	"log/slog"
	"user-service/internal/domain"
	"user-service/internal/lib/logger"
)

func handleServiceError(err error, op, defaultLogText string, log *slog.Logger) error {
	switch {
	case errors.Is(err, domain.ErrUserNotFound):
		log.Warn("user not found", logger.Err(err))
		return fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
	case errors.Is(err, domain.ErrUsernameNotFound):
		log.Warn("username not found", logger.Err(err))
		return fmt.Errorf("%s: %w", op, domain.ErrUsernameNotFound)

	case errors.Is(err, domain.ErrUserExists):
		log.Error("user already exists", logger.Err(domain.ErrUserExists))
		return fmt.Errorf("%s: %w", op, domain.ErrUserExists)

	case errors.Is(err, domain.ErrInvalidCredentials):
		log.Warn("invalid credentials", logger.Err(err))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidCredentials)

	case errors.Is(err, domain.ErrInvalidEmailFormat):
		log.Warn("invalid email format", logger.Err(domain.ErrInvalidEmailFormat))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidEmailFormat)
	case errors.Is(err, domain.ErrInvalidPassFormat):
		log.Warn("invalid password format", logger.Err(domain.ErrInvalidPassFormat))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidPassFormat)
	case errors.Is(err, domain.ErrInvalidUsernameFormat):
		log.Warn("invalid username format", logger.Err(domain.ErrInvalidUsernameFormat))
		return fmt.Errorf("%s: %w", op, domain.ErrInvalidUsernameFormat)

	default:
		logString := fmt.Sprintf("failed to %s", defaultLogText)
		log.Warn(logString, logger.Err(err))
		return fmt.Errorf("%s: %w", op, err)
	}
}
