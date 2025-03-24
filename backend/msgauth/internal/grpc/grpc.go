package grpccontroller

import (
	msgauthpb "github.com/snowwyd/messenger/msgauth/gen"
	"google.golang.org/grpc"
)

// serverAPI обрабатывает все входящие запросы
type serverAPI struct {
	// UnimplementedAuthServer делает автоматически заглушки для неимплементированных ручек
	msgauthpb.UnimplementedAuthServer
	auth  AuthService // сервис
	users UsersService
}

func Register(gRPC *grpc.Server, auth AuthService, users UsersService) {
	msgauthpb.RegisterAuthServer(gRPC, &serverAPI{auth: auth, users: users}) // добавляет в grpc сервер сервис auth
}
