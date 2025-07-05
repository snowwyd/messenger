package mongodb

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	client      *mongo.Client
	database    *mongo.Database
	chatsCol    *mongo.Collection
	channelsCol *mongo.Collection
	messagesCol *mongo.Collection
}

func New(
	storagePath string,
	dbName string,
	chatsColName string,
	channelsColName string,
	messagesColName string,
) *MongoDB {
	clientOpts := options.Client().ApplyURI(storagePath)
	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		panic(err)
	}

	db := client.Database(dbName)

	return &MongoDB{
		client:      client,
		database:    db,
		chatsCol:    db.Collection(chatsColName),
		channelsCol: db.Collection(channelsColName),
		messagesCol: db.Collection(messagesColName),
	}
}

func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}
