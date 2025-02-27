package models

type Chat struct {
	ID      string   `bson:"_id,omitempty"`
	UserIDs []string `bson:"user_ids"`
}
