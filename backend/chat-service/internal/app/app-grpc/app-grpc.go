package appgrpc

import (
	"fmt"
	"log/slog"
	"net"

	chatgrpc "chat-service/internal/grpc"
	"chat-service/internal/grpc/middleware"

	"google.golang.org/grpc"
)

type App struct {
	log        *slog.Logger
	gRPCServer *grpc.Server
	port       int
}

func New(log *slog.Logger,
	chatService chatgrpc.Chat,
	channelService chatgrpc.Channel,
	messageService chatgrpc.Message,
	port int,
	appSecret string,
) *App {
	gRPCServer := grpc.NewServer(
		grpc.UnaryInterceptor(middleware.AuthInterceptor(appSecret)),
		grpc.StreamInterceptor(middleware.StreamAuthInterceptor(appSecret)),
	)

	chatgrpc.Register(gRPCServer, chatService, channelService, messageService)

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
	const op = "appgrpc.Run"

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
	const op = "appgrpc.Stop"

	a.log.With(slog.String("operation", op)).Info("grpc server is stopping")
	a.gRPCServer.GracefulStop()
}
