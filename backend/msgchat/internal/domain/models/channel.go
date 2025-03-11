package models

type Channel struct {
	ID         string   `bson:"_id,omitempty"`
	ChatID     string   `bson:"chat_id"`
	Name       string   `bson:"name"`
	Type       string   `bson:"type"`
	MessageIDs []string `bson:"message_ids"`
}
