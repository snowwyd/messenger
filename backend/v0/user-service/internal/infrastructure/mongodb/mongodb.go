package mongodb

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	_ "go.mongodb.org/mongo-driver/x/mongo/driver"
)

type MongoDB struct {
	client   *mongo.Client
	database *mongo.Database
	usersCol *mongo.Collection
}

func New(storagePath string, dbName string, usersColName string) *MongoDB {
	clientOpts := options.Client().ApplyURI(storagePath)
	client, err := mongo.Connect(context.Background(), clientOpts)
	if err != nil {
		panic(err)
	}

	db := client.Database(dbName)

	return &MongoDB{
		client:   client,
		database: db,
		usersCol: db.Collection(usersColName),
	}
}

func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}
