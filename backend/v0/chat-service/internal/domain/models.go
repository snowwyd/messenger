package domain

import "time"

type Channel struct {
	ID         string   `bson:"_id,omitempty"`
	ChatID     string   `bson:"chat_id"`
	Name       string   `bson:"name"`
	Type       string   `bson:"type"`
	MessageIDs []string `bson:"message_ids"`
}

type Chat struct {
	ID         string   `bson:"_id,omitempty"`
	Type       string   `bson:"type"`
	Name       string   `bson:"name"`
	MemberIDs  []string `bson:"member_ids"`
	ChannelIDs []string `bson:"channel_ids"`
}

type Message struct {
	ID        string    `bson:"_id,omitempty"`
	ChannelID string    `bson:"channel_id"`
	Text      string    `bson:"text"`
	SenderID  string    `bson:"sender_id"`
	CreatedAt time.Time `bson:"created_at"`
}
