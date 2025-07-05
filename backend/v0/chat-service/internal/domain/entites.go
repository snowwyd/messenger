package domain

import chatpb "chat-service/gen"

type ChatInfo struct {
	ID            string
	Type          string
	Name          string
	MemberIDs     []string
	ProtoChannels []*chatpb.Channel
}

type ChatPreview struct {
	ID   string
	Name string
}

type NewMessageEvent struct {
	Message *Message
}
