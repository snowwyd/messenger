package middleware

import (
	"context"
	"errors"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"github.com/snowwyd/messenger/msgchat/internal/lib/jwtutil" // Утилита для работы с JWT
)

// Общая функция для извлечения user_id из контекста
func extractUserIDFromContext(ctx context.Context, appSecret string) (context.Context, error) {
	// Извлекаем метаданные gRPC
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("missing metadata")
	}

	authHeader, exists := md["authorization"]
	if !exists || len(authHeader) == 0 {
		return nil, errors.New("authorization token is required")
	}

	// Парсим токен (ожидаем формат "Bearer <token>")
	tokenParts := strings.Split(authHeader[0], " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return nil, errors.New("invalid token format")
	}

	token := tokenParts[1]

	// Проверяем и декодируем токен
	claims, err := jwtutil.ValidateToken(token, appSecret)
	if err != nil {
		return nil, err
	}

	// Добавляем user_id в контекст
	ctx = context.WithValue(ctx, "user_id", claims.UserID)

	return ctx, nil
}

// Middleware для unary RPC
func AuthInterceptor(appSecret string) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// Извлекаем user_id из контекста
		newCtx, err := extractUserIDFromContext(ctx, appSecret)
		if err != nil {
			return nil, err
		}

		// Продолжаем выполнение запроса
		return handler(newCtx, req)
	}
}

// Middleware для streaming RPC
func StreamAuthInterceptor(appSecret string) grpc.StreamServerInterceptor {
	return func(
		srv interface{},
		stream grpc.ServerStream,
		info *grpc.StreamServerInfo,
		handler grpc.StreamHandler,
	) error {
		// Извлекаем user_id из контекста
		ctx, err := extractUserIDFromContext(stream.Context(), appSecret)
		if err != nil {
			return err
		}

		// Создаем обертку для ServerStream с новым контекстом
		wrappedStream := &wrappedServerStream{
			ServerStream:   stream,
			WrappedContext: ctx,
		}

		// Продолжаем выполнение запроса
		return handler(srv, wrappedStream)
	}
}

// Обертка для grpc.ServerStream
type wrappedServerStream struct {
	grpc.ServerStream
	WrappedContext context.Context
}

func (w *wrappedServerStream) Context() context.Context {
	return w.WrappedContext
}
