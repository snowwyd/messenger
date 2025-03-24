package mongodb

import (
	"context"
	"errors"
	"fmt"

	"github.com/snowwyd/messenger/msgauth/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

// UserEmail возвращает пользователя по email
func (m *MongoDB) UserEmail(ctx context.Context, email string) (domain.User, error) {
	const op = "infrastructure.mongodb.userprovider.UserEmail"

	var user domain.User

	err := m.usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		switch {
		case errors.Is(err, mongo.ErrNoDocuments):
			return domain.User{}, fmt.Errorf("%s : %w", op, domain.ErrUserNotFound)
		default:
			return domain.User{}, fmt.Errorf("%s : %w", op, err)
		}
	}

	return user, nil
}

// UserUsername возвращает пользователя по username
func (m *MongoDB) UserUsername(ctx context.Context, username string) (domain.User, error) {
	const op = "infrastructure.mongodb.userprovider.UserUsername"

	var user domain.User

	err := m.usersCol.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		switch {
		case errors.Is(err, mongo.ErrNoDocuments):
			return domain.User{}, fmt.Errorf("%s : %w", op, domain.ErrUserNotFound)
		default:
			return domain.User{}, fmt.Errorf("%s : %w", op, err)
		}
	}

	return user, nil
}

func (m *MongoDB) Usernames(ctx context.Context, userIDs []string) (map[string]string, error) {
	const op = "infrastructure.mongodb.userprovider.Usernames"

	objectIDs := make([]primitive.ObjectID, 0, len(userIDs))
	for _, id := range userIDs {
		oid, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, fmt.Errorf("%s: invalid ObjectID %s: %w", op, id, err)
		}
		objectIDs = append(objectIDs, oid)
	}

	cursor, err := m.usersCol.Find(ctx, bson.M{"_id": bson.M{"$in": objectIDs}})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	defer cursor.Close(ctx)

	usernames := make(map[string]string)

	for cursor.Next(ctx) {
		var user domain.User

		if err := cursor.Decode(&user); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}

		usernames[user.ID] = user.Username
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	if len(usernames) == 0 {
		return nil, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
	}

	return usernames, nil
}

func (m *MongoDB) UserIDs(ctx context.Context, usernames []string) (map[string]string, error) {
	const op = "infrastructure.mongodb.userprovider.UserIDs"

	cursor, err := m.usersCol.Find(ctx, bson.M{"username": bson.M{"$in": usernames}})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	defer cursor.Close(ctx)

	userIDs := make(map[string]string)

	for cursor.Next(ctx) {
		var user domain.User

		if err := cursor.Decode(&user); err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}

		userIDs[user.Username] = user.ID
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	if len(userIDs) == 0 {
		return nil, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
	}

	return userIDs, nil
}
