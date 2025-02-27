package jwtutil

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"uid"`
	Email  string `json:"email"`
	AppID  string `json:"app_id"`
	jwt.RegisteredClaims
}

var (
	// TODO: убрать хардкод
	appSecret = "sanyakrut"
)

func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(appSecret), nil // 💡 Исправлено: привели строку к []byte
	})
	if err != nil {
		return nil, errors.New("invalid token format")
	}

	_, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Получаем `app.Secret` из базы по `app_id`

	// Теперь проверяем токен с корректным `app.Secret`
	token, err = jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(appSecret), nil
	})

	if err != nil {
		return nil, errors.New("invalid token signature")
	}

	claimsData, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Проверяем срок действия токена
	if claimsData.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claimsData, nil
}
