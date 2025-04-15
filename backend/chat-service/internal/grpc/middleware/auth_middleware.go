package middleware

import (
	"context"
	"errors"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"chat-service/internal/lib/utils"
)

func extractUserIDFromContext(ctx context.Context, appSecret string) (context.Context, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("missing metadata")
	}

	authHeader, exists := md["authorization"]
	if !exists || len(authHeader) == 0 {
		return nil, errors.New("authorization token is required")
	}

	tokenParts := strings.Split(authHeader[0], " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return nil, errors.New("invalid token format")
	}

	token := tokenParts[1]

	claims, err := utils.ValidateToken(token, appSecret)
	if err != nil {
		return nil, err
	}

	ctx = context.WithValue(ctx, "user_id", claims.UserID)

	return ctx, nil
}

func AuthInterceptor(appSecret string) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		newCtx, err := extractUserIDFromContext(ctx, appSecret)
		if err != nil {
			return nil, err
		}

		return handler(newCtx, req)
	}
}

func StreamAuthInterceptor(appSecret string) grpc.StreamServerInterceptor {
	return func(
		srv interface{},
		stream grpc.ServerStream,
		info *grpc.StreamServerInfo,
		handler grpc.StreamHandler,
	) error {
		ctx, err := extractUserIDFromContext(stream.Context(), appSecret)
		if err != nil {
			return err
		}

		wrappedStream := &wrappedServerStream{
			ServerStream:   stream,
			WrappedContext: ctx,
		}

		return handler(srv, wrappedStream)
	}
}

type wrappedServerStream struct {
	grpc.ServerStream
	WrappedContext context.Context
}

func (w *wrappedServerStream) Context() context.Context {
	return w.WrappedContext
}
