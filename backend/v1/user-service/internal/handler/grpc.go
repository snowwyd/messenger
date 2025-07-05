package handler

import (
	userpb "user-service/gen/v1"

	"google.golang.org/grpc"
)

type serverAPI struct {
	userpb.UnimplementedAuthServiceServer
	authService AuthService

	userpb.UnimplementedUserServiceServer
	userService UsersService
}

func Register(
	gRPC *grpc.Server,
	authService AuthService,
	userService UsersService,
) {
	api := &serverAPI{
		authService: authService,
		userService: userService,
	}

	userpb.RegisterAuthServiceServer(gRPC, api)
	userpb.RegisterUserServiceServer(gRPC, api)

}
