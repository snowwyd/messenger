package appgrpc

import (
	"fmt"
	"log/slog"
	"net"
	"user-service/internal/handler"

	"google.golang.org/grpc"
)

type GRPCApp struct {
	log        *slog.Logger
	gRPCServer *grpc.Server
	port       int
}

func New(
	log *slog.Logger,
	authService handler.AuthService,
	usersService handler.UsersService,
	port int,
) *GRPCApp {
	gRPCServer := grpc.NewServer()

	handler.Register(gRPCServer, authService, usersService)

	return &GRPCApp{
		log:        log,
		gRPCServer: gRPCServer,
		port:       port,
	}
}

func (grpcapp *GRPCApp) Run() error {
	const op = "grpcapp.Run"

	log := grpcapp.log.With(
		slog.String("op", op),
		slog.Int("port", grpcapp.port),
	)

	l, err := net.Listen("tcp", fmt.Sprintf(":%d", grpcapp.port))
	if err != nil {
		panic(fmt.Errorf("%s: %w", op, err))
	}

	log.Info("grpc server is running", slog.String("address", l.Addr().String()))
	if err := grpcapp.gRPCServer.Serve(l); err != nil {
		panic(fmt.Errorf("%s: %w", op, err))
	}

	return nil
}

func (grpcapp *GRPCApp) Stop() {
	const op = "grpcapp.Stop"

	grpcapp.log.With(slog.String("op", op)).Info("grpc server is stopping")
	grpcapp.gRPCServer.GracefulStop()
}
