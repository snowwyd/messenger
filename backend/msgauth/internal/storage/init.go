package storage

// утилита для инициализации базы данных для тестов

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// TestDBCleaner — структура для работы с тестовой БД
type TestDBCleaner struct {
	client    *mongo.Client
	dbName    string
	usersColl string
	appsColl  string
}

// NewTestDBCleaner создает новый инстанс TestDBCleaner
func NewTestDBCleaner(uri, dbName string) (*TestDBCleaner, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}

	return &TestDBCleaner{
		client:    client,
		dbName:    dbName,
		usersColl: "users",
		appsColl:  "apps",
	}, nil
}

// Cleanup очищает коллекцию users
func (t *TestDBCleaner) Cleanup() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db := t.client.Database(t.dbName)

	if _, err := db.Collection(t.usersColl).DeleteMany(ctx, bson.M{}); err != nil {
		return err
	}

	// Очистка и повторное заполнение коллекции apps
	// appsColl := db.Collection(t.appsColl)
	// if err := appsColl.Drop(ctx); err != nil {
	// 	return err
	// }

	// if _, err := appsColl.InsertOne(ctx, bson.M{
	// 	"name":       "TestApp",
	// 	"app_secret": "super-secret-key",
	// }); err != nil {
	// 	return err
	// }

	return nil
}

// Close закрывает соединение с БД
func (t *TestDBCleaner) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return t.client.Disconnect(ctx)
}
