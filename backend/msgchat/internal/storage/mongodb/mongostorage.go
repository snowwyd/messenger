package mongodb

import (
	"context"
	"errors"
	"fmt"

	"github.com/snowwyd/messenger/msgchat/internal/domain/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

var (
	ErrChatNotFound = errors.New("chat not found")
)

// CHAT METHODS
// FindChat ищет чат, в поле member_ids которого есть все айди из userIDs
func (m *MongoDB) FindChat(ctx context.Context, userIDs []string) (*models.Chat, error) {
	const op = "storage.mongodb.FindChat"

	var chat models.Chat

	err := m.chatsCol.FindOne(ctx, bson.M{"member_ids": bson.M{"$all": userIDs}}).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return &chat, nil
}

// FindChatByID ищет чат по его id
func (m *MongoDB) FindChatByID(ctx context.Context, chatID string, userID string) (models.Chat, error) {
	const op = "storage.mongodb.FindChatByID"

	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return models.Chat{}, fmt.Errorf("%s : internal error", op)
	}

	var chat models.Chat

	err = m.chatsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Chat{}, nil
		}
		return models.Chat{}, fmt.Errorf("%s : %w", op, err)
	}

	if chat.Type == "private" {
		var notUserID string
		for _, id := range chat.MemberIDs {
			if id != userID {
				notUserID = id
				break
			}
		}
		chat.Name = notUserID
	}

	return chat, nil
}

// FindUserChats ищет все чаты пользователя private/group и возвращает слайс их превью (_id, name)
func (m *MongoDB) FindUserChats(ctx context.Context, userID string, chatType string) ([]*models.ChatPreview, error) {
	const op = "storage.mongodb.FindUserChats"

	filter := bson.M{
		"member_ids": bson.M{"$all": []string{userID}},
		"type":       chatType,
	}

	cursor, err := m.chatsCol.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}
	defer cursor.Close(ctx)

	var previews []*models.ChatPreview
	for cursor.Next(ctx) {
		var chat struct {
			ID        primitive.ObjectID `bson:"_id"`
			Name      string             `bson:"name"`
			MemberIDs []string           `bson:"member_ids"`
		}

		if err := cursor.Decode(&chat); err != nil {
			return nil, fmt.Errorf("%s : %w", op, err)
		}

		chatName := chat.Name
		if chatType == "private" {
			var notUserID string
			for _, id := range chat.MemberIDs {
				if id != userID {
					notUserID = id
					break
				}
			}
			chatName = notUserID
		}

		previews = append(previews, &models.ChatPreview{
			ID:   chat.ID.Hex(),
			Name: chatName,
		})
	}
	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return previews, nil
}

// SaveChat сохраняет чат в БД
func (m *MongoDB) SaveChat(ctx context.Context, chat models.Chat) (string, error) {
	const op = "storage.mongodb.SaveChat"

	res, err := m.chatsCol.InsertOne(ctx, bson.M{"type": chat.Type, "name": chat.Name, "member_ids": chat.MemberIDs, "channel_ids": chat.ChannelIDs})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}

	return objectID.Hex(), nil
}

// CHANNEL METHODS
// SaveChannels сохраняет канал в БД и обновляет ChannelIDs для конкретного чата
func (m *MongoDB) SaveChannel(ctx context.Context, channel models.Channel) (string, error) {
	const op = "storage.mongodb.SaveChannel"

	res, err := m.channelsCol.InsertOne(ctx, bson.M{"chat_id": channel.ChatID, "name": channel.Name, "type": channel.Type, "message_ids": channel.MessageIDs})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}
	chanID := objectID.Hex()

	update := bson.M{
		"$push": bson.M{"channel_ids": chanID},
	}

	objChatID, err := primitive.ObjectIDFromHex(channel.ChatID)
	if err != nil {
		return "", fmt.Errorf("%s : internal error", op)
	}

	_, err = m.chatsCol.UpdateOne(ctx, bson.M{"_id": objChatID}, update)
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	return chanID, nil
}

// FindChannelByID ищет канал по его id
func (m *MongoDB) FindChannelByID(ctx context.Context, channelID string) (models.Channel, error) {
	const op = "storage.mongodb.FindChatByID"

	objID, err := primitive.ObjectIDFromHex(channelID)
	if err != nil {
		return models.Channel{}, fmt.Errorf("%s : internal error", op)
	}

	var channel models.Channel

	err = m.channelsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&channel)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return models.Channel{}, nil
		}
		return models.Channel{}, fmt.Errorf("%s : %w", op, err)
	}

	return channel, nil
}

// MESSAGE METHODS
// SaveMessage сохраняет сообщение в БД и обновляет MessageIDs для конкретного канала
func (m *MongoDB) SaveMessage(ctx context.Context, message models.Message) (string, error) {
	const op = "storage.mongodb.SaveMessage"

	res, err := m.messagesCol.InsertOne(ctx, bson.M{"channel_id": message.ChannelID, "sender_id": message.SenderID, "text": message.Text, "created_at": message.CreatedAt})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : internal error", op)
	}
	messageID := objectID.Hex()

	update := bson.M{
		"$push": bson.M{"message_ids": messageID},
	}

	objChannelID, err := primitive.ObjectIDFromHex(message.ChannelID)
	if err != nil {
		return "", fmt.Errorf("%s : internal error", op)
	}

	_, err = m.channelsCol.UpdateOne(ctx, bson.M{"_id": objChannelID}, update)
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	return messageID, nil
}

// GetMessages возварщает слайс указателей на структуры Message для конкретного канала
func (m *MongoDB) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*models.Message, error) {
	const op = "storage.mongodb.GetMessages"

	filter := bson.M{"channel_id": channelID}

	opts := options.Find().
		SetSort(bson.D{{Key: "created_at", Value: -1}}). // Сортировка от новых к старым
		SetLimit(int64(limit)).
		SetSkip(int64(offset - 1))

	cursor, err := m.messagesCol.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}
	defer cursor.Close(ctx)

	var messages []*models.Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return messages, nil
}
