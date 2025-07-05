package mapper

import (
	chatpb "chat-service/gen"
	"chat-service/internal/domain"

	"google.golang.org/protobuf/types/known/timestamppb"
)

func ConvertMessageToProto(msg *domain.Message) *chatpb.Message {
	return &chatpb.Message{
		MessageId: msg.ID,
		ChannelId: msg.ChannelID,
		Text:      msg.Text,
		SenderId:  msg.SenderID,
		CreatedAt: timestamppb.New(msg.CreatedAt),
	}
}

func ConvertMessagesToProto(messages []*domain.Message) []*chatpb.Message {
	protoMessages := make([]*chatpb.Message, len(messages))
	for i, msg := range messages {
		protoMessages[i] = ConvertMessageToProto(msg)
	}
	return protoMessages
}

func ConvertChatPreviewToProto(chatPrw *domain.ChatPreview) *chatpb.ChatPreview {
	return &chatpb.ChatPreview{
		ChatId: chatPrw.ID,
		Name:   chatPrw.Name,
	}
}

func ConvertChatPreviewsToProto(chatPreviews []*domain.ChatPreview) []*chatpb.ChatPreview {
	protoChatPreviews := make([]*chatpb.ChatPreview, len(chatPreviews))
	for i, chatPrw := range chatPreviews {
		protoChatPreviews[i] = ConvertChatPreviewToProto(chatPrw)
	}
	return protoChatPreviews
}

func ConvertChannelToProto(chn domain.Channel) *chatpb.Channel {
	return &chatpb.Channel{
		ChannelId:  chn.ID,
		ChatId:     chn.ChatID,
		Name:       chn.Name,
		Type:       chn.Type,
		MessageIds: chn.MessageIDs,
	}
}

func ConvertChannelsToProto(channels []domain.Channel) []*chatpb.Channel {
	protoChannels := make([]*chatpb.Channel, len(channels))
	for i, chn := range channels {
		protoChannels[i] = ConvertChannelToProto(chn)
	}
	return protoChannels
}
