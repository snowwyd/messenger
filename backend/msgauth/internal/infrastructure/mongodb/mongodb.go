package mongodb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

type MongoDB struct {
	client   *mongo.Client
	database *mongo.Database
	usersCol *mongo.Collection
}

// New создает новый экземпляр MongoDB
func New(storagePath string, dbName string) (*MongoDB, error) {
	uri := (storagePath)

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
	}, nil
}

// Close закрывает соединение с MongoDB
func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}
