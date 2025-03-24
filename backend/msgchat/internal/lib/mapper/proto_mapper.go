package mapper

import (
	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// ConvertMessageToProto преобразует models.Message в msgv1chat.Message
func ConvertMessageToProto(msg *domain.Message) *msgv1chat.Message {
	return &msgv1chat.Message{
		MessageId: msg.ID,
		ChannelId: msg.ChannelID,
		Text:      msg.Text,
		SenderId:  msg.SenderID,
		CreatedAt: timestamppb.New(msg.CreatedAt),
	}
}

// ConvertMessagesToProto преобразует массив messages
func ConvertMessagesToProto(messages []*domain.Message) []*msgv1chat.Message {
	protoMessages := make([]*msgv1chat.Message, len(messages))
	for i, msg := range messages {
		protoMessages[i] = ConvertMessageToProto(msg)
	}
	return protoMessages
}

// ConvertChatPreviewToProto преобразует models.ChatPreview в msgv1chat.ChatPreview
func ConvertChatPreviewToProto(chatPrw *domain.ChatPreview) *msgv1chat.ChatPreview {
	return &msgv1chat.ChatPreview{
		ChatId: chatPrw.ID,
		Name:   chatPrw.Name,
	}
}

func ConvertChatPreviewsToProto(chatPreviews []*domain.ChatPreview) []*msgv1chat.ChatPreview {
	protoChatPreviews := make([]*msgv1chat.ChatPreview, len(chatPreviews))
	for i, chatPrw := range chatPreviews {
		protoChatPreviews[i] = ConvertChatPreviewToProto(chatPrw)
	}
	return protoChatPreviews
}

// ConvertChannelToProto преобразует models.Channel в msgv1chat.Channel
func ConvertChannelToProto(chn domain.Channel) *msgv1chat.Channel {
	return &msgv1chat.Channel{
		ChannelId:  chn.ID,
		ChatId:     chn.ChatID,
		Name:       chn.Name,
		Type:       chn.Type,
		MessageIds: chn.MessageIDs,
	}
}

func ConvertChannelsToProto(channels []domain.Channel) []*msgv1chat.Channel {
	protoChannels := make([]*msgv1chat.Channel, len(channels))
	for i, chn := range channels {
		protoChannels[i] = ConvertChannelToProto(chn)
	}
	return protoChannels
}
