package grpccontroller

import (
	chatpb "chat-service/gen"

	"google.golang.org/grpc"
)

type serverAPI struct {
	chatpb.UnimplementedConversationServer
	chat    Chat
	channel Channel
	message Message
}

func Register(gRPC *grpc.Server, chat Chat, channel Channel, message Message) {
	chatpb.RegisterConversationServer(gRPC, &serverAPI{chat: chat, channel: channel, message: message})
}
