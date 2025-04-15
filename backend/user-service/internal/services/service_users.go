package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"user-service/internal/domain"
	"user-service/internal/domain/interfaces"
	"user-service/internal/lib/logger"
)

type Users struct {
	log         *slog.Logger
	usrProvider interfaces.UserProvider
}

func NewUsersService(log *slog.Logger, userProvider interfaces.UserProvider) *Users {
	return &Users{
		log:         log,
		usrProvider: userProvider,
	}
}

func (u *Users) GetUsernames(ctx context.Context, userIDs []string) (map[string]string, error) {
	const op = "services.users.GetUsernames"

	log := u.log.With(slog.String("op", op), slog.Any("userIDs", userIDs))
	log.Info("getting usernames")

	usernames, err := u.usrProvider.Usernames(ctx, userIDs)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserNotFound):
			log.Error("user not found", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
		default:
			u.log.Error("failed to get usernames", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, err)
		}
	}

	missingUserIDs := make([]string, 0, len(userIDs))
	for _, uid := range userIDs {
		if _, exists := usernames[uid]; !exists {
			missingUserIDs = append(missingUserIDs, uid)
		}
	}
	if len(missingUserIDs) > 0 {
		log.Warn("some user_ids were not found", slog.Any("missing_user_ids", missingUserIDs))
	}

	log.Info("usernames got successfully")
	return usernames, nil
}

func (u *Users) GetUserIDs(ctx context.Context, usernames []string) (map[string]string, error) {
	const op = "services.users.GetUserIDs"

	log := u.log.With(slog.String("op", op), slog.Any("usernames", usernames))
	log.Info("getting usernames")

	userIDs, err := u.usrProvider.UserIDs(ctx, usernames)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUsernameNotFound):
			log.Error("username not found", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, domain.ErrUsernameNotFound)
		default:
			u.log.Error("failed to get usernames", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, err)
		}
	}

	missingUsernames := make([]string, 0, len(usernames))
	for _, username := range usernames {
		if _, exists := userIDs[username]; !exists {
			missingUsernames = append(missingUsernames, username)
		}
	}
	if len(missingUsernames) > 0 {
		log.Warn("some usernames were not found", slog.Any("missing_usernames", missingUsernames))
	}

	log.Info("usernames got successfully")
	return userIDs, nil
}
