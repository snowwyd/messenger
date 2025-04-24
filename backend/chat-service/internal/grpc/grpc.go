package grpccontroller

import (
	chatpb "chat-service/gen"
	"chat-service/internal/domain/interfaces"

	"google.golang.org/grpc"
)

type serverAPI struct {
	chatpb.UnimplementedConversationServer
	conversationService interfaces.ConversationService
	viewService         interfaces.ViewService
	managerService      interfaces.ManagerService
}

func Register(gRPC *grpc.Server, conversationService interfaces.ConversationService, viewService interfaces.ViewService, managerService interfaces.ManagerService) {
	chatpb.RegisterConversationServer(gRPC, &serverAPI{conversationService: conversationService, viewService: viewService, managerService: managerService})
}
