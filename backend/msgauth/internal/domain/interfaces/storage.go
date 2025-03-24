package interfaces

import (
	"context"

	"github.com/snowwyd/messenger/msgauth/internal/domain"
)

// UserSaver ... Интерфейсы, которые будут реализованы в Storage для любых БД, разбиение для обеспечения гибкости
// минус: неудобно передавать в качестве объекта
type UserSaver interface {
	SaveUser(ctx context.Context, email string, passHash []byte, username string) (uid string, err error)
}

type UserProvider interface {
	UserEmail(ctx context.Context, email string) (user domain.User, err error)
	UserUsername(ctx context.Context, username string) (user domain.User, err error)

	// Usernames - выдает множество usernames по множеству user_id
	Usernames(ctx context.Context, userIDs []string) (usernames map[string]string, err error)
	// UserIDs - выдает множество user_ids по множеству username
	UserIDs(ctx context.Context, usernames []string) (userIDs map[string]string, err error)
}
