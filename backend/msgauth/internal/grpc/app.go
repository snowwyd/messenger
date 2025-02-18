package grpc

import "log/slog"

type App struct {
	log        *slog.Logger
	gRPCServer *grpc.Server
	port       int
}
