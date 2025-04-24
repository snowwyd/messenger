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

// TODO: rename
func (m *MongoDB) FindChat(ctx context.Context, userIDs []string) (*domain.Chat, error) {
	const op = "infrastructure.mongodb.chat.FindChat"

	var chat domain.Chat

	err := m.chatsCol.FindOne(ctx, bson.M{"member_ids": bson.M{"$all": userIDs}}).Decode(&chat)
	if err != nil {
		switch {
		case errors.Is(err, mongo.ErrNoDocuments):
			return nil, nil
		default:
			return nil, fmt.Errorf("%s : %w", op, err)
		}
	}

	return &chat, nil
}

func (m *MongoDB) FindChatByID(ctx context.Context, chatID string, userID string) (domain.Chat, error) {
	const op = "infrastructure.mongodb.chat.FindChatByID"

	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return domain.Chat{}, fmt.Errorf("%s : %w", op, err)
	}

	var chat domain.Chat

	err = m.chatsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat)
	if err != nil {
		switch {
		case errors.Is(err, mongo.ErrNoDocuments):
			return domain.Chat{}, domain.ErrChatNotFound
		default:
			return domain.Chat{}, fmt.Errorf("%s : %w", op, err)
		}
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

func (m *MongoDB) FindUserChats(ctx context.Context, userID string, chatType string) ([]*domain.ChatPreview, error) {
	const op = "infrastructure.mongodb.chat.FindUserChats"

	filter := bson.M{
		"member_ids": bson.M{"$all": []string{userID}},
		"type":       chatType,
	}

	cursor, err := m.chatsCol.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}
	defer cursor.Close(ctx)

	var previews []*domain.ChatPreview
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

		previews = append(previews, &domain.ChatPreview{
			ID:   chat.ID.Hex(),
			Name: chatName,
		})
	}
	if err := cursor.Err(); err != nil {
		return nil, fmt.Errorf("%s : %w", op, err)
	}

	return previews, nil
}

func (m *MongoDB) SaveChat(ctx context.Context, chat domain.Chat) (string, error) {
	const op = "infrastructure.mongodb.chat.SaveChat"

	res, err := m.chatsCol.InsertOne(ctx, bson.M{"type": chat.Type, "name": chat.Name, "member_ids": chat.MemberIDs, "channel_ids": chat.ChannelIDs})
	if err != nil {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	objectID, ok := res.InsertedID.(primitive.ObjectID)
	if !ok {
		return "", fmt.Errorf("%s : %w", op, err)
	}

	return objectID.Hex(), nil
}
