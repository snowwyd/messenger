package grpccontroller

import (
	userpb "user-service/gen"
	"user-service/internal/domain/interfaces"

	"google.golang.org/grpc"
)

type serverAPI struct {
	userpb.UnimplementedAuthServer
	auth  interfaces.AuthService
	users interfaces.UsersService
}

func Register(
	gRPC *grpc.Server,
	auth interfaces.AuthService,
	users interfaces.UsersService,
) {
	userpb.RegisterAuthServer(gRPC, &serverAPI{auth: auth, users: users})
}
