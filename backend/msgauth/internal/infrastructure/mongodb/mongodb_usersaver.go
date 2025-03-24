package mongodb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

// SaveUser сохраняет пользователя в базе по email и хэшу пароля
func (m *MongoDB) SaveUser(ctx context.Context, email string, passHash []byte, username string) (string, error) {
	const op = "infrastructure.mongodb.usersaver.SaveUser"

	res, err := m.usersCol.InsertOne(ctx, bson.M{"email": email, "passHash": passHash, "username": username})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}

	return objectID.Hex(), nil
}
