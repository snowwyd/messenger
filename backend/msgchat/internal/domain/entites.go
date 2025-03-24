package domain

import msgv1chat "github.com/snowwyd/messenger/msgchat/gen"

type ChatInfo struct {
	ID            string
	Type          string
	Name          string
	MemberIDs     []string
	ProtoChannels []*msgv1chat.Channel
}

type ChatPreview struct {
	ID   string
	Name string
}

type NewMessageEvent struct {
	Message *Message
}
