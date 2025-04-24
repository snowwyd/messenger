package mongodb

import (
	"context"
	"fmt"
	"user-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

func (m *MongoDB) SaveUser(ctx context.Context, email string, passHash []byte, username string) (string, error) {
	const op = "infrastructure.mongodb.usersaver.SaveUser"

	res, err := m.usersCol.InsertOne(ctx, bson.M{"email": email, "passHash": passHash, "username": username})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : %w", op, domain.ErrInternal)
	}

	return objectID.Hex(), nil
}
