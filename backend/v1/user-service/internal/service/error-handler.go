package service

import (
	"errors"
	"fmt"
	"log/slog"
	"user-service/internal/domain"
	"user-service/internal/lib/logger"
)

type errorHandler struct {
	log *slog.Logger
	op  string
}

func NewErrorHandler(log *slog.Logger, op string) *errorHandler {
	return &errorHandler{
		log: log,
		op:  op,
	}
}

func (eh *errorHandler) Handle(err error, defaultLogText ...string) error {
	switch {
	case errors.Is(err, domain.ErrUserNotFound):
		eh.log.Warn("user not found", logger.Err(domain.ErrUserNotFound))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrUserNotFound)
	case errors.Is(err, domain.ErrRegistered):
		eh.log.Warn("user already registered", logger.Err(domain.ErrRegistered))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrRegistered)

	case errors.Is(err, domain.ErrInvalidEmailFormat):
		eh.log.Warn("invalid email format", logger.Err(domain.ErrInvalidEmailFormat))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrInvalidEmailFormat)
	case errors.Is(err, domain.ErrInvalidUsernameFormat):
		eh.log.Warn("invalid username format", logger.Err(domain.ErrInvalidUsernameFormat))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrInvalidUsernameFormat)
	case errors.Is(err, domain.ErrInvalidPasswordFormat):
		eh.log.Warn("invalid password format", logger.Err(domain.ErrInvalidPasswordFormat))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrInvalidPasswordFormat)
	case errors.Is(err, domain.ErrInvalidCredentials):
		eh.log.Warn("invalid credentials", logger.Err(domain.ErrInvalidCredentials))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrInvalidCredentials)

	case errors.Is(err, domain.ErrInternal):
		eh.log.Warn("internal error", logger.Err(err))
		return fmt.Errorf("%s: %w", eh.op, domain.ErrInternal)

	default:
		logString := fmt.Sprintf("failed to %s", defaultLogText)
		eh.log.Warn(logString, logger.Err(err))
		return fmt.Errorf("%s: %w", eh.op, err)
	}
}
