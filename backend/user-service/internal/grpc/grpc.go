package grpccontroller

import (
	userpb "user-service/gen"

	"google.golang.org/grpc"
)

type serverAPI struct {
	userpb.UnimplementedAuthServer
	auth  AuthService
	users UsersService
}

func Register(gRPC *grpc.Server, auth AuthService, users UsersService) {
	userpb.RegisterAuthServer(gRPC, &serverAPI{auth: auth, users: users})
}
