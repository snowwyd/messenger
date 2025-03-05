package middleware

import (
	"context"
	"errors"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"msgchat/internal/lib/jwtutil" // Утилита для работы с JWT
)

func AuthInterceptor(appSecret string) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// Извлекаем токен из метаданных gRPC
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

		// Продолжаем выполнение запроса
		return handler(ctx, req)
	}
}
