package auth

import (
	"context"
	msgv1 "github.com/snowwyd/protos/gen/go/msgauth"
	"google.golang.org/grpc"
)

// serverAPI обрабатывает все входящие запросы
type serverAPI struct {
	// UnimplementedAuthServer делает автоматически заглушки для неимплементированных ручек
	msgv1.UnimplementedAuthServer
}

func Register(gRPC *grpc.Server) {
	msgv1.RegisterAuthServer(gRPC, &serverAPI{})
}

// все ручки сервиса

func (s *serverAPI) Login(ctx context.Context, req *msgv1.LoginRequest) (*msgv1.LoginResponse, error) {
	return &msgv1.LoginResponse{
		Token: req.GetEmail(),
	}, nil
}

func (s *serverAPI) Register(ctx context.Context, req *msgv1.RegisterRequest) (*msgv1.RegisterResponse, error) {
	panic("implement me")
}

func (s *serverAPI) IsAdmin(ctx context.Context, req *msgv1.IsAdminRequest) (*msgv1.IsAdminResponse, error) {
	panic("implement me")
}
