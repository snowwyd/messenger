package interfaces

import "context"

type AuthService interface {
	Login(ctx context.Context, email string, password string) (token string, err error)
	RegisterNewUser(ctx context.Context, email string, password string, username string) (userID string, err error)
}

type UsersService interface {
	GetStrings(ctx context.Context, userIDs []string, key string) (strings map[string]string, err error)
}
