package utils

import (
	"user-service/internal/domain"

	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
}

func CheckPassword(user domain.User, password string) error {
	return bcrypt.CompareHashAndPassword(user.PassHash, []byte(password))
}
