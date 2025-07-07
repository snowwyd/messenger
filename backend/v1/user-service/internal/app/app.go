package app

import (
	"context"
	"log/slog"
	appgrpc "user-service/internal/app/app-grpc"
	"user-service/internal/config"
	"user-service/internal/handler"
	"user-service/internal/infrastructure/mongodb"
	"user-service/internal/service"
)

type App struct {
	GRPCSrv *appgrpc.GRPCApp
	DB      *mongodb.MongoDB
}

func New(log *slog.Logger, cfg *config.Config) *App {
	log.Debug("loading db config")
	mongoCfg := mongodb.NewMongoConfig(cfg)
	if err := mongoCfg.Validate(); err != nil {
		panic(err)
	}

	log.Debug("init db connection")
	db, err := mongodb.NewMongoDB(context.Background(), mongoCfg, log)
	if err != nil {
		panic(err)
	}

	log.Debug("init user repository")
	userRepo := mongodb.NewUserRepository(db.GetDB(), mongoCfg)

	// TODO: init user service
	log.Debug("init auth service")
	authService := service.NewAuthService(log, cfg, userRepo)
	var usersService handler.UsersService

	log.Debug("init grpc service")
	grpcApp := appgrpc.New(log, authService, usersService, cfg.Yaml.GRPC.Port)

	return &App{
		DB:      db,
		GRPCSrv: grpcApp,
	}
}
