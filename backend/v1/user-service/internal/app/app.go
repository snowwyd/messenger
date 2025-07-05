package app

import (
	"log/slog"
	appgrpc "user-service/internal/app/app-grpc"
	"user-service/internal/config"
	"user-service/internal/handler"
)

type App struct {
	GRPCSrv *appgrpc.GRPCApp
}

func New(log *slog.Logger, cfg *config.Config) *App {
	// TODO: init db

	// TODO: init services
	var authService handler.AuthService
	var usersService handler.UsersService

	grpcApp := appgrpc.New(log, authService, usersService, cfg.Yaml.GRPC.Port)

	return &App{
		GRPCSrv: grpcApp,
	}
}
