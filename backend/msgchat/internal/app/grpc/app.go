package grpcapp

import (
	"fmt"
	"log/slog"
	"net"

	chatgrpc "github.com/snowwyd/messenger/msgchat/internal/grpc/chat"
	"github.com/snowwyd/messenger/msgchat/internal/grpc/middleware"

	"google.golang.org/grpc"
)

type App struct {
	log        *slog.Logger
	gRPCServer *grpc.Server
	port       int
}

func New(log *slog.Logger, chatService chatgrpc.Chat, port int, appSecret string) *App {
	// NewServer запускает сервер
	gRPCServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(appSecret)),
		grpc.StreamInterceptor(middleware.StreamAuthInterceptor(appSecret)),
	)

	chatgrpc.Register(gRPCServer, chatService)

	return &App{
		log:        log,
		gRPCServer: gRPCServer,
		port:       port,
	}
}

func (a *App) MustRun() {
	if err := a.Run(); err != nil {
		panic(err)
	}
}

func (a *App) Run() error {
	const op = "grpcapp.Run"

	log := a.log.With(slog.String("operation", op), slog.Int("port", a.port))

	l, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	log.Info("grpc server is running", slog.String("address", l.Addr().String()))

	if err := a.gRPCServer.Serve(l); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

func (a *App) Stop() {
	const op = "grpcapp.Stop"

	a.log.With(slog.String("operation", op)).Info("grpc server is stopping")
	a.gRPCServer.GracefulStop()
}
