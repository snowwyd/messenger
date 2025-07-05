package service

import (
	"context"
	"user-service/internal/domain"
)

type UsersService struct {
}

func (usersService *UsersService) GetUserByUsername(ctx context.Context, username string) (domain.User, error) {
	const op = "service.user.GetUserByUsername"

	// TODO: validation

	// TODO: get user from db

	return domain.User{}, nil
}

func (usersService *UsersService) GetUserByUserID(ctx context.Context, userID string) (domain.User, error) {
	const op = "service.user.GetUserByUserID"

	// TODO: validation

	// TODO: get user from db

	return domain.User{}, nil
}

func (usersService *UsersService) UpdateUsername(ctx context.Context, username string) error {
	const op = "service.user.UpdateUsername"

	// TODO: JWT verify

	// TODO: validation

	// TODO: update data in db

	return nil
}
