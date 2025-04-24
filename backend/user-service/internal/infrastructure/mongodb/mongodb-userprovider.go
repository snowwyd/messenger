package mongodb

import (
	"context"
	"errors"
	"fmt"

	"user-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

func (m *MongoDB) GetUserByField(ctx context.Context, email, field string) (domain.User, error) {
	const op = "infrastructure.mongodb.userprovider.GetUserByField"

	var user domain.User

	err := m.usersCol.FindOne(ctx, bson.M{field: email}).Decode(&user)
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

func (m *MongoDB) GetStringsByField(ctx context.Context, fieldStrings []string, field string) (result map[string]string, err error) {
	const op = "infrastructure.mongodb.userprovider.GetStringsByField"

	var cursor *mongo.Cursor

	switch field {
	case "user_ids":
		objectIDs := make([]primitive.ObjectID, 0, len(fieldStrings))
		for _, id := range fieldStrings {
			oid, err := primitive.ObjectIDFromHex(id)
			if err != nil {
				return nil, fmt.Errorf("%s: invalid ObjectID %s: %w", op, id, err)
			}
			objectIDs = append(objectIDs, oid)
		}
		cursor, err = m.usersCol.Find(ctx, bson.M{"_id": bson.M{"$in": objectIDs}})

	case "usernames":
		cursor, err = m.usersCol.Find(ctx, bson.M{"username": bson.M{"$in": fieldStrings}})
		if err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}

	}

	defer cursor.Close(ctx)

	result = make(map[string]string)

	// TODO: вынести логику преобразования данных в сервисный слой, а здесь оставить только выдачу пользователей
	switch field {
	case "user_ids":
		for cursor.Next(ctx) {
			var user domain.User

			if err := cursor.Decode(&user); err != nil {
				return nil, fmt.Errorf("%s: %w", op, err)
			}

			result[user.ID] = user.Username
		}
	case "usernames":
		for cursor.Next(ctx) {
			var user domain.User

			if err := cursor.Decode(&user); err != nil {
				return nil, fmt.Errorf("%s: %w", op, err)
			}

			result[user.Username] = user.ID
		}
	}

	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
	}

	return result, nil
}
