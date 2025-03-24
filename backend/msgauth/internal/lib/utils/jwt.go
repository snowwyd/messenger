package utils

import (
	"time"

	"github.com/snowwyd/messenger/msgauth/internal/domain"

	"github.com/golang-jwt/jwt/v5"
)

func NewToken(user domain.User, appSecret string, duration time.Duration) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)

	claims := token.Claims.(jwt.MapClaims)
	claims["uid"] = user.ID
	claims["email"] = user.Email
	claims["exp"] = time.Now().Add(duration).Unix()

	tokenString, err := token.SignedString([]byte(appSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
