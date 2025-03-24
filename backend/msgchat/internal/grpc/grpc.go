package grpccontroller

import (
	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"google.golang.org/grpc"
)

type serverAPI struct {
	msgv1chat.UnimplementedConversationServer
	chat    Chat
	channel Channel
	message Message
}


func Register(gRPC *grpc.Server, chat Chat, channel Channel, message Message) {
	msgv1chat.RegisterConversationServer(gRPC, &serverAPI{chat: chat, channel: channel, message: message})
}
