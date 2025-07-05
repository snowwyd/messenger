package interfaces

import (
	"context"

	"user-service/internal/domain"
)

type UserSaver interface {
	SaveUser(ctx context.Context, email string, passHash []byte, username string) (uid string, err error)
}

type UserProvider interface {
	GetUserByField(ctx context.Context, email, field string) (user domain.User, err error)

	GetStringsByField(ctx context.Context, fieldStrings []string, field string) (strings map[string]string, err error)
}
