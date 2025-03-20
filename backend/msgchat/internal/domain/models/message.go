package models

import "time"

type Message struct {
	ID        string    `bson:"_id,omitempty"`
	ChannelID string    `bson:"channel_id"`
	Text      string    `bson:"text"`
	SenderID  string    `bson:"sender_id"`
	CreatedAt time.Time `bson:"created_at"`
}

type NewMessageEvent struct {
	Message *Message
}
