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
	ErrMsgNotFound  = errors.New("message not found")
)

// Chat находит модель Chat в БД по chatID
func (m *MongoDB) Chat(ctx context.Context, chatID string) (models.Chat, error) {
	const op = "storage.mongodb.Chat"

	var chat models.Chat

	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return models.Chat{}, fmt.Errorf("%s : internal error", op)
	}

	err = m.chatsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Chat{}, fmt.Errorf("%s : %w", op, ErrChatNotFound)
		}
		return models.Chat{}, fmt.Errorf("%s : %w", op, err)
	}

	return chat, nil
}

// Chats находит чаты пользователя в БД по userID
func (m *MongoDB) Chats(ctx context.Context, userID string) ([]*models.Chat, error) {
	const op = "storage.mongodb.Chats"

	filter := bson.M{"user_id": userID}
	opts := options.Find().
		SetSort(bson.D{{Key: "joined_at", Value: -1}}) // Сортировка от новых к старым

	// Получаем список chat_id, в которых состоит пользователь
	cursor, err := m.usersChatsCol.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}
	defer cursor.Close(ctx)

	// Структура для получения chat_ids из users_chats
	var userChats []struct {
		ChatID string `bson:"chat_id"`
	}

	if err := cursor.All(ctx, &userChats); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	// создание слайса с ObjectID чатов для их детального отображения
	objIDs := make([]primitive.ObjectID, len(userChats))

	for i, uc := range userChats {
		objID, err := primitive.ObjectIDFromHex(uc.ChatID)
		fmt.Println(err)
		if err != nil {
			return nil, fmt.Errorf("%s : internal error", op)
		}
		objIDs[i] = objID
	}

	// получение информации о чатах в слайс моделей
	chatsCursor, err := m.chatsCol.Find(ctx, bson.M{"_id": bson.M{"$in": objIDs}})
	if err != nil {
		return nil, fmt.Errorf("%s: failed to fetch chats: %w", op, err)
	}
	defer chatsCursor.Close(ctx)

	var chats []*models.Chat
	if err := chatsCursor.All(ctx, &chats); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return chats, nil
}

// SaveChat сохраняет Chat в коллекции Chats и строит связь в коллекции UsersChats
func (m *MongoDB) SaveChat(ctx context.Context, userIDs []string) (string, error) {
	const op = "storage.mongoDB.SaveChat"

	res, err := m.chatsCol.InsertOne(ctx, bson.M{"user_ids": userIDs})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}

	chatID := objectID.Hex()

	var userChatDocs []interface{}
	for _, userID := range userIDs {
		userChatDocs = append(userChatDocs, bson.M{
			"user_id":   userID,
			"chat_id":   chatID,
			"joined_at": time.Now(),
		})
	}
	// Вставляем связи пользователей и чата в users_chats
	if _, err := m.usersChatsCol.InsertMany(ctx, userChatDocs); err != nil {
		return "", fmt.Errorf("%s : failed to insert user-chat relations: %w", op, err)
	}

	return chatID, nil
}

func (m *MongoDB) Message(ctx context.Context, messageID string) (models.Message, error) {
	const op = "storage.mongodb.Message"

	var message models.Message
	err := m.messagesCol.FindOne(ctx, bson.M{"_id": messageID}).Decode(&message)
	if err != nil {
		return models.Message{}, fmt.Errorf("%s: %w", op, err)
	}

	return message, nil
}

func (m *MongoDB) Messages(ctx context.Context, chatID string, limit int32, offset int32) ([]*models.Message, error) {
	const op = "storage.mongodb.Messages"

	// Фильтр: ищем сообщения только из конкретного чата
	filter := bson.M{"chat_id": chatID}

	// Опции запроса: сортируем по времени и применяем лимит с оффсетом
	opts := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}). // Сортировка от новых к старым
		SetLimit(int64(limit)).
		SetSkip(int64(offset - 1))

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

func (m *MongoDB) DeleteMessage(ctx context.Context, messageID string) (bool, error) {
	const op = "storage.mongoDB.DeleteMessage"

	objID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return false, fmt.Errorf("%s: %w", op, ErrMsgNotFound)
	}

	res, err := m.messagesCol.DeleteOne(ctx, bson.M{"_id": objID})
	if err != nil {
		return false, fmt.Errorf("%s: %w", op, err)
	}

	if res.DeletedCount == 0 {
		return false, nil
	}

	return true, nil
}
