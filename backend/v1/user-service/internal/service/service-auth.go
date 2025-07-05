package service

import (
	"context"
	"user-service/internal/domain"
)

type AuthService struct {
}

type RegisterResponse struct {
	userID string
	token  string
}

type UserRepository interface {
	CheckFreeSlot(ctx context.Context, email, username string) (exists bool, err error)
	SaveUser(ctx context.Context, user domain.User) (userID string, err error)

	GetUserByField(ctx context.Context, paramName string, paramValue any) (user domain.User, err error)

	UpdateUser(ctx context.Context, user domain.User) (err error)
}

func (authService *AuthService) Register(ctx context.Context, email, password, username string) (RegisterResponse, error) {
	const op = "service.auth.Register"

	var userID, token string

	// TODO: log

	// TODO: email, password and username regexp validation

	// TODO: check if username and email are free

	// TODO: 2FA

	// TODO: hash password

	// TODO: add to db

	// TODO: generate token

	return RegisterResponse{
		userID: userID,
		token:  token,
	}, nil
}

func (authService *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	const op = "service.auth.Login"

	var token string

	// TODO: log

	// TODO: email and password regexp validation

	// TODO: find user

	// TODO: compare password

	// TODO: generate token

	return token, nil
}
