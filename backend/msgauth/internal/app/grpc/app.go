package grpcapp

import (
	"fmt"
	"log/slog"
	"net"

	authgrpc "github.com/snowwyd/messenger/msgauth/internal/grpc/auth"
	"google.golang.org/grpc"
)

type App struct {
	log        *slog.Logger
	gRPCServer *grpc.Server
	port       int
}

// New создает новое grpc приложение
func New(log *slog.Logger, authService authgrpc.Auth, port int) *App {
	// NewServer запускает сервер
	gRPCServer := grpc.NewServer()

	authgrpc.Register(gRPCServer, authService)

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

// Run запускает приложение
func (a *App) Run() error {
	const op = "grpcapp.Run"

	// автоматически добавит ко всем логам операцию и номер порта
	log := a.log.With(
		slog.String("operation", op),
		slog.Int("port", a.port),
	)

	// прослушивание tcp сообщений по указанному порту
	l, err := net.Listen("tcp", fmt.Sprintf(":%d", a.port))
	if err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	log.Info("grpc server is running", slog.String("address", l.Addr().String()))

	// запуск сервера, который будет обрабатывать запросы, приходящие на l адрес
	if err := a.gRPCServer.Serve(l); err != nil {
		return fmt.Errorf("%s: %w", op, err)
	}

	return nil
}

// Stop делает GracefulStop и выдает информацию в логах
func (a *App) Stop() {
	const op = "grpcapp.Stop"

	a.log.With(slog.String("operation", op)).Info("grpc server is stopping")
	// встроенный в пакет grpc метод (прекращает прием новых запросов и ждет обработку старых)
	a.gRPCServer.GracefulStop()
}
