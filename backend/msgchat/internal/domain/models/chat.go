package models

type Chat struct {
	ID         string   `bson:"_id,omitempty"`
	Type       string   `bson:"type"`
	Name       string   `bson:"name"`
	MemberIDs  []string `bson:"member_ids"`
	ChannelIDs []string `bson:"channel_ids"`
}

type ChatPreview struct {
	ID   string `bson:"_id,omitempty"`
	Name string `bson:"name"`
}
