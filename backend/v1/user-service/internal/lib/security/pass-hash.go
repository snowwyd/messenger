package security

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) ([]byte, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	return hashedPassword, nil
}

func ComparePassword(password string, passHash []byte) error {
	return bcrypt.CompareHashAndPassword(passHash, []byte(password))
}
