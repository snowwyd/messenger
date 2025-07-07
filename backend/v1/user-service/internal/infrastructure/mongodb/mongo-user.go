package mongodb

import (
	"context"
	"errors"
	"fmt"
	"time"
	"user-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type userRepository struct {
	collection *mongo.Collection
	timeout    time.Duration
}

func NewUserRepository(db *mongo.Database, cfg *MongoDBConfig) *userRepository {
	return &userRepository{
		collection: db.Collection(cfg.UsersCol),
		timeout:    cfg.RequestTimeout,
	}
}

func (repo *userRepository) SaveUser(ctx context.Context, user domain.User) (string, error) {
	const op = "infrastructure.mongodb.user.SaveUser"

	ctx, cancel := context.WithTimeout(ctx, repo.timeout)
	defer cancel()

	userDoc := bson.M{
		"username": user.Username,
		"email":    user.Email,
		"passHash": user.PassHash,
	}

	result, err := repo.collection.InsertOne(ctx, userDoc)
	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}

	objectID, ok := result.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s: %w", op, domain.ErrInternal)
	}

	return objectID.Hex(), nil
}

func (repo *userRepository) CheckFreeSlot(ctx context.Context, email, username string) (bool, error) {
	const op = "infrastructure.mongodb.user.CheckFreeSlot"

	ctx, cancel := context.WithTimeout(ctx, repo.timeout)
	defer cancel()

	filter := bson.M{
		"$or": []bson.M{
			{"email": email},
			{"username": username},
		},
	}

	count, err := repo.collection.CountDocuments(ctx, filter)
	if err != nil {
		return false, fmt.Errorf("%s: %w", op, domain.ErrInternal)
	}

	return count == 0, nil
}

func (repo *userRepository) UpdateUser(ctx context.Context, user domain.User) error {
	const op = "infrastructure.mongodb.user.UpdateUser"

	ctx, cancel := context.WithTimeout(ctx, repo.timeout)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(user.ID)
	if err != nil {
		return fmt.Errorf("%s: %w", op, domain.ErrInternal)
	}

	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"email":    user.Email,
			"username": user.Username,
			"passHash": user.PassHash,
		},
	}

	opts := options.Update().SetUpsert(false)
	result, err := repo.collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("%s: %w", op, domain.ErrInternal)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)
	}

	return nil
}

// TODO: generic maybe?
func (repo *userRepository) GetUserByField(ctx context.Context, paramName string, paramValue any) (domain.User, error) {
	const op = "infrastructure.mongodb.user.GetUserByField"

	ctx, cancel := context.WithTimeout(ctx, repo.timeout)
	defer cancel()

	filter := bson.M{paramName: paramValue}

	var result domain.MongoUser

	err := repo.collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return domain.User{}, fmt.Errorf("%s: %w", op, domain.ErrUserNotFound)

		}
		return domain.User{}, fmt.Errorf("%s: %w", op, domain.ErrInternal)
	}

	return domain.User{
		ID:       result.ID.Hex(),
		Email:    result.Email,
		Username: result.Username,
		PassHash: result.PassHash,
	}, nil
}
