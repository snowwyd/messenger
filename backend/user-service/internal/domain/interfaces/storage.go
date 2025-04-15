package interfaces

import (
	"context"

	"user-service/internal/domain"
)

type UserSaver interface {
	SaveUser(ctx context.Context, email string, passHash []byte, username string) (uid string, err error)
}

type UserProvider interface {
	UserEmail(ctx context.Context, email string) (user domain.User, err error)
	UserUsername(ctx context.Context, username string) (user domain.User, err error)

	Usernames(ctx context.Context, userIDs []string) (usernames map[string]string, err error)
	UserIDs(ctx context.Context, usernames []string) (userIDs map[string]string, err error)
}
