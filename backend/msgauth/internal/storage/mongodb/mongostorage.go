package mongostorage

import (
	"context"
	"errors"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
	"msgauth/internal/domain/models"
	"time"
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
	timeout  time.Duration
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
func (m *MongoDB) SaveUser(ctx context.Context, email string, passHash []byte) error {
	const op = "storage.mongodb.User"

	_, err := m.usersCol.InsertOne(ctx, bson.M{"email": email, "passHash": passHash})
	if err != nil {
		return fmt.Errorf("%s : %w", op, err)
	}
	return nil
}

func (m *MongoDB) App(ctx context.Context, appID int) (models.App, error) {
	const op = "storage.mongodb.App"

	var app models.App
	err := m.appsCol.FindOne(ctx, bson.M{"id": appID}).Decode(&app)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.App{}, ErrAppNotFound
		}
		return models.App{}, fmt.Errorf("%s : %w", op, err)
	}
	return app, nil
}

func (m *MongoDB) IsAdmin(ctx context.Context, email string) (bool, error) {
	const op = "storage.mongodb.IsAdmin"

	var user struct {
		IsAdmin *bool `bson:"is_admin"`
	}
	err := m.usersCol.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, fmt.Errorf("%s : %w", op, ErrAppNotFound)
		}
		return false, fmt.Errorf("%s : %w", op, err)
	}
	if user.IsAdmin == nil {
		return false, nil // Если поле отсутствует, считаем, что это не админ
	}

	return *user.IsAdmin, nil
}
