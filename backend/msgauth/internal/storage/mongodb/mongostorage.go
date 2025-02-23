package mongostorage

import (
	"context"
	"errors"
	"fmt"
	"msgauth/internal/domain/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

var (
	ErrUserExists   = errors.New("user already exists")
	ErrUserNotFound = errors.New("user not found")
	ErrAppNotFound  = errors.New("app not found")
)

type MongoDB struct {
	client   *mongo.Client
	database *mongo.Database
	usersCol *mongo.Collection
	appsCol  *mongo.Collection
}

// New создает новый экземпляр MongoDB
func New(storagePath string, dbName string) (*MongoDB, error) {
	uri := fmt.Sprintf("mongodb://%s", storagePath)

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	db := client.Database(dbName)

	return &MongoDB{
		client:   client,
		database: db,
		usersCol: db.Collection("users"),
		appsCol:  db.Collection("apps"),
	}, nil
}

// Close закрывает соединение с MongoDB
func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}

// User возвращает пользователя по email
func (m *MongoDB) User(ctx context.Context, email string) (models.User, error) {
	const op = "storage.mongodb.User"
	//ctx, cancel := context.WithTimeout(ctx, m.timeout)
	//defer cancel()

	var user models.User

	err := m.usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.User{}, fmt.Errorf("%s : %w", op, ErrUserNotFound)
		}
		return models.User{}, fmt.Errorf("%s : %w", op, err)
	}

	return user, nil
}

// SaveUser сохраняет пользователя в базе по email и хэшу пароля
func (m *MongoDB) SaveUser(ctx context.Context, email string, passHash []byte, isAdmin bool) (string, error) {
	const op = "storage.mongodb.User"

	res, err := m.usersCol.InsertOne(ctx, bson.M{"email": email, "passHash": passHash, "is_admin": isAdmin})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}

	return objectID.Hex(), nil
}

// App возвращает приложение по appID
func (m *MongoDB) App(ctx context.Context, appID string) (models.App, error) {
	const op = "storage.mongodb.App"

	objID, err := primitive.ObjectIDFromHex(appID)
	if err != nil {
		return models.App{}, fmt.Errorf("%s : internal error", op)
	}

	var app models.App
	err = m.appsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&app)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.App{}, ErrAppNotFound
		}
		return models.App{}, fmt.Errorf("%s : %w", op, err)
	}
	return app, nil
}

// IsAdmin проверяет пользователя на is_admin по appID
func (m *MongoDB) IsAdmin(ctx context.Context, userID string) (bool, error) {
	const op = "storage.mongodb.IsAdmin"

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return false, fmt.Errorf("%s : internal error", op)
	}

	// для демаршаллинга необходимых полей bson
	var result struct {
		IsAdmin *bool `bson:"is_admin"`
	}

	err = m.usersCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&result)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, fmt.Errorf("%s : %w", op, ErrAppNotFound)
		}
		return false, fmt.Errorf("%s : %w", op, err)
	}

	// возвращает false в случае, если в bson нет поля is_admin
	// if result == nil {
	// 	return false, nil
	// }

	return *result.IsAdmin, nil
}
