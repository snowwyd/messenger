package models

import "time"

type Message struct {
	ID        string    `bson:"_id,omitempty"`
	ChatID    string    `bson:"chat_id"`
	SenderID  string    `bson:"sender_id"`
	Text      string    `bson:"text"`
	Timestamp time.Time `bson:"timestamp"`
}
