package jwtutil

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID string `json:"uid"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func ValidateToken(tokenString string, appSecret string) (*Claims, error) {

	// Теперь проверяем токен с корректным `app.Secret`
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

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
	if claimsData.ExpiresAt == nil || claimsData.ExpiresAt.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return claimsData, nil
}
