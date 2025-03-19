package models

import (
	msgv1chat "github.com/snowwyd/protos/gen/go/msgchat"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ConvertMessageToProto преобразует models.Message в msgv1chat.Message
func ConvertMessageToProto(msg *Message) *msgv1chat.Message {
	return &msgv1chat.Message{
		MessageId: msg.ID,
		ChannelId: msg.ChannelID,
		Text:      msg.Text,
		SenderId:  msg.SenderID,
		CreatedAt: timestamppb.New(msg.CreatedAt),
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

// ConvertChatPreviewToProto преобразует models.ChatPreview в msgv1chat.ChatPreview
func ConvertChatPreviewToProto(chatPrw *ChatPreview) *msgv1chat.ChatPreview {
	return &msgv1chat.ChatPreview{
		ChatId: chatPrw.ID,
		Name:   chatPrw.Name,
	}
}

// ConvertMessagesToProto преобразует массив ChatPreviews
func ConvertChatPreviewsToProto(chatPreviews []*ChatPreview) []*msgv1chat.ChatPreview {
	protoChatPreviews := make([]*msgv1chat.ChatPreview, len(chatPreviews))
	for i, chatPrw := range chatPreviews {
		protoChatPreviews[i] = ConvertChatPreviewToProto(chatPrw)
	}
	return protoChatPreviews
}

// ConvertChannelToProto преобразует models.Channel в msgv1chat.Channel
func ConvertChannelToProto(chn Channel) *msgv1chat.Channel {
	return &msgv1chat.Channel{
		ChannelId:  chn.ID,
		ChatId:     chn.ChatID,
		Name:       chn.Name,
		Type:       chn.Type,
		MessageIds: chn.MessageIDs,
	}
}
