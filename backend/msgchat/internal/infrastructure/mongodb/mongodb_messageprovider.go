package mongodb

import (
	"context"
	"fmt"

	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// SaveMessage сохраняет сообщение в БД и обновляет MessageIDs для конкретного канала
func (m *MongoDB) SaveMessage(ctx context.Context, message domain.Message) (string, error) {
	const op = "infrastructure.mongodb.message.SaveMessage"

	// TODO: проверить, можно ли каскадно обновлять список сообщений в канале сразу же
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

	if _, err = m.channelsCol.UpdateOne(ctx, bson.M{"_id": objChannelID}, update); err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	return messageID, nil
}

// GetMessages возварщает слайс указателей на структуры Message для конкретного канала
func (m *MongoDB) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*domain.Message, error) {
	const op = "infrastructure.mongodb.message.GetMessages"

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

	var messages []*domain.Message
	if err := cursor.All(ctx, &messages); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return messages, nil
}
