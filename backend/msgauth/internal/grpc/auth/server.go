package auth

import (
	msgv1 "github.com/snowwyd/protos/gen/go/msgauth"
	"google.golang.org/grpc"
)

// serverAPI обрабатывает все входящие запросы
type serverAPI struct {
	msgv1.UnimplementedAuthServer
}

func Register(gRPC *grpc.Server) {
	msgv1.RegisterAuthServer(gRPC, &serverAPI{})

}
