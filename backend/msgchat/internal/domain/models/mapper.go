package models

import (
	msgv1chat "github.com/snowwyd/protos/gen/go/messenger/msgchat"
)

// ConvertMessageToProto преобразует models.Message в msgv1chat.Message
func ConvertMessageToProto(msg *Message) *msgv1chat.Message {
	return &msgv1chat.Message{
		MessageId: msg.ID,
		SenderId:  msg.SenderID,
		Text:      msg.Text,
		Timestamp: msg.Timestamp.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// ConvertMessagesToProto преобразует массив messages
func ConvertMessagesToProto(messages []*Message) []*msgv1chat.Message {
	protoMessages := make([]*msgv1chat.Message, len(messages))
	for i, msg := range messages {
		protoMessages[i] = ConvertMessageToProto(msg)
	}
	return protoMessages
}

func ConvertChatToProto(chat *Chat) *msgv1chat.ChatInfo {
	return &msgv1chat.ChatInfo{
		ChatId:  chat.ID,
		UserIds: chat.UserIDs,
	}
}

func ConvertChatsToProto(chats []*Chat) []*msgv1chat.ChatInfo {
	protoChats := make([]*msgv1chat.ChatInfo, len(chats))
	for i, chat := range chats {
		protoChats[i] = ConvertChatToProto(chat)
	}
	return protoChats
}
