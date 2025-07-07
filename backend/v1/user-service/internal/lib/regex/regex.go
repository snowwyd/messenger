package regex

import (
	"regexp"
	"user-service/internal/domain"
)

func CheckCredentials(email, password, username string) error {
	var (
		emailRegex    = regexp.MustCompile(`^[\w.-]+@[\w]+\.[a-zA-Z]{2,}$`)
		passwordRegex = regexp.MustCompile(`^[a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]{};':",.<>\/?]{8,}$`)
		usernameRegex = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_]*$`)
	)

	switch {
	case !emailRegex.MatchString(email):
		return domain.ErrInvalidEmailFormat
	case !passwordRegex.MatchString(password):
		return domain.ErrInvalidPasswordFormat
	case !usernameRegex.MatchString(username) && len(username) > 0:
		return domain.ErrInvalidUsernameFormat
	default:
		return nil
	}
}
