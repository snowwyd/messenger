package services

import (
	"context"
	"fmt"
	"log/slog"

	"user-service/internal/domain/interfaces"
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

func (u *Users) GetStrings(ctx context.Context, fieldStrings []string, field string) (result map[string]string, err error) {
	const op = "services.users.GetStrings"

	log := u.log.With(slog.String("op", op), slog.Any(field, fieldStrings))
	log.Info("getting strings")

	result, err = u.usrProvider.GetStringsByField(ctx, fieldStrings, field)
	if err != nil {
		return nil, handleServiceError(err, op, fmt.Sprintf("get %s", field), log)
	}

	missingStrings := make([]string, 0, len(fieldStrings))
	for _, uid := range fieldStrings {
		if _, exists := result[uid]; !exists {
			missingStrings = append(missingStrings, uid)
		}
	}
	if len(missingStrings) > 0 {
		log.Warn(fmt.Sprintf("some %s were not found", field), slog.Any(fmt.Sprintf("missing %s", field), missingStrings))
	}

	log.Info(fmt.Sprintf("%s got successfully", field))
	return result, nil
}
