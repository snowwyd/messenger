package mongodb

import (
	"context"
	"errors"
	"fmt"

	"chat-service/internal/domain"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (m *MongoDB) SaveChannel(ctx context.Context, channel domain.Channel) (string, error) {
	const op = "infrastructure.mongodb.channel.SaveChannel"

	res, err := m.channelsCol.InsertOne(ctx, bson.M{"chat_id": channel.ChatID, "name": channel.Name, "type": channel.Type, "message_ids": channel.MessageIDs})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : %w", op, err)
	}
	chanID := objectID.Hex()

	update := bson.M{
		"$push": bson.M{"channel_ids": chanID},
	}

	objChatID, err := primitive.ObjectIDFromHex(channel.ChatID)
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	if _, err = m.chatsCol.UpdateOne(ctx, bson.M{"_id": objChatID}, update); err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	return chanID, nil
}

func (m *MongoDB) FindChannelByID(ctx context.Context, channelID string) (domain.Channel, error) {
	const op = "infrastructure.mongodb.channel.FindChannelByID"

	objID, err := primitive.ObjectIDFromHex(channelID)
	if err != nil {
		return domain.Channel{}, fmt.Errorf("%s : %w", op, err)
	}

	var channel domain.Channel

	if err = m.channelsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&channel); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return domain.Channel{}, nil
		}
		return domain.Channel{}, fmt.Errorf("%s : %w", op, err)
	}

	return channel, nil
}

func (m *MongoDB) FindChannelsByIDs(ctx context.Context, channelIDs []string) ([]domain.Channel, error) {
	const op = "infrastructure.mongodb.channel.FindChannelsByIDs"

	var objIDs []primitive.ObjectID
	for _, id := range channelIDs {
		objID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", op, err)
		}
		objIDs = append(objIDs, objID)
	}

	cursor, err := m.channelsCol.Find(ctx, bson.M{"_id": bson.M{"$in": objIDs}})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	defer cursor.Close(ctx)

	var channels []domain.Channel
	if err = cursor.All(ctx, &channels); err != nil {
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	return channels, nil
}
