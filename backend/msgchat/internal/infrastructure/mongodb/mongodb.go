package mongodb

import (
	"context"
	"fmt"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	client      *mongo.Client
	database    *mongo.Database
	chatsCol    *mongo.Collection
	messagesCol *mongo.Collection
	channelsCol *mongo.Collection
}

func New(storagePath string, dbName string) (*MongoDB, error) {
	uri := (storagePath)

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	db := client.Database(dbName)

	return &MongoDB{
		client:      client,
		database:    db,
		chatsCol:    db.Collection("chats"),
		messagesCol: db.Collection("messages"),
		channelsCol: db.Collection("channels"),
	}, nil
}

func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}
