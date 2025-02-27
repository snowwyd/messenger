package mongodb

import (
	"context"
	"errors"
	"fmt"
	"msgchat/internal/domain/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	client        *mongo.Client
	database      *mongo.Database
	chatsCol      *mongo.Collection
	messagesCol   *mongo.Collection
	usersChatsCol *mongo.Collection
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
		client:        client,
		database:      db,
		chatsCol:      db.Collection("chats"),
		messagesCol:   db.Collection("messages"),
		usersChatsCol: db.Collection("users_chats"),
	}, nil
}

func (m *MongoDB) Close() error {
	return m.client.Disconnect(context.Background())
}

var (
	ErrChatNotFound = errors.New("chat not found")
)

func (m *MongoDB) Chat(ctx context.Context, chatID string) (models.Chat, error) {
	const op = "storage.mongodb.Chat"

	var chat models.Chat

	err := m.chatsCol.FindOne(ctx, bson.M{"_id": chatID}).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Chat{}, fmt.Errorf("%s : %w", op, ErrChatNotFound)
		}
		return models.Chat{}, fmt.Errorf("%s : %w", op, err)
	}

	return chat, nil
}

func (m *MongoDB) SaveMessage(ctx context.Context, senderID string, chatID string, text string, timestamp time.Time) (string, error) {
	const op = "storage.mongodb.SaveMessage"

	res, err := m.messagesCol.InsertOne(ctx, bson.M{"chat_id": chatID, "sender_id": senderID, "text": text, "timestamp": timestamp})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}

	return objectID.Hex(), nil
}

func (m *MongoDB) Messages(ctx context.Context, chatID string, limit int32, offset int32) ([]*models.Message, error) {
	const op = "storage.Messages"

	// Фильтр: ищем сообщения только из конкретного чата
	filter := bson.M{"chat_id": chatID}

	// Опции запроса: сортируем по времени и применяем лимит с оффсетом
	opts := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}). // Сортировка от новых к старым
		SetLimit(int64(limit)).
		SetSkip(int64(offset))

	// Выполняем запрос к MongoDB
	cursor, err := m.messagesCol.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}
	defer cursor.Close(ctx)

	// Обрабатываем полученные документы
	var messages []*models.Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return messages, nil
}
