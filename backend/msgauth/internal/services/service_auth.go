package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"regexp"
	"time"

	"github.com/snowwyd/messenger/msgauth/internal/domain"
	"github.com/snowwyd/messenger/msgauth/internal/domain/interfaces"
	"github.com/snowwyd/messenger/msgauth/internal/lib/logger"
	"github.com/snowwyd/messenger/msgauth/internal/lib/utils"
)

// Сервисный слой занимается бизнес-логикой
// только он может взаимодействовать с БД
// Для передачи данных между сервисным слоем и слоем работы с данными создаются модели (internal/domain)

// Auth - структура для поставления сервиса
type Auth struct {
	log         *slog.Logger
	usrSaver    interfaces.UserSaver
	usrProvider interfaces.UserProvider
	tokenTTL    time.Duration
	appSecret   string
}

// New - конструктор Auth сервиса
func NewAuthService(log *slog.Logger, userSaver interfaces.UserSaver, userProvider interfaces.UserProvider, tokenTTL time.Duration, appSecret string) *Auth {
	return &Auth{
		log:         log,
		usrSaver:    userSaver,
		usrProvider: userProvider,
		tokenTTL:    tokenTTL,
		appSecret:   appSecret,
	}
}

// Login проверяет, есть ли User с предоставленными данными в системе
func (a *Auth) Login(ctx context.Context, email string, password string) (string, error) {
	const op = "services.auth.Login"

	log := a.log.With(slog.String("op", op), slog.String("email", email))

	log.Info("logging user in")

	log.Debug("getting user by email")
	user, err := a.usrProvider.UserEmail(ctx, email)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserNotFound):
			a.log.Warn("user not found", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidCredentials)
		default:
			a.log.Error("failed to get user", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidCredentials)
		}
	}

	log.Debug("checking credentials")
	if err := utils.CheckPassword(user, password); err != nil {
		a.log.Info("invalid credentials", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidCredentials)
	}

	log.Debug("generating token")
	token, err := utils.NewToken(user, a.appSecret, a.tokenTTL)
	if err != nil {
		a.log.Error("failed to generate token", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Info("user logged in successfully")
	return token, nil
}

// RegisterNewUser проверяет, есть ли уже такой пользователь, если нет - возвращает новый id
func (a *Auth) RegisterNewUser(ctx context.Context, email string, password string, username string) (res string, err error) {
	const op = "services.auth.RegisterNewUser"

	log := a.log.With(slog.String("op", op), slog.String("email", email), slog.String("username", username))

	log.Info("registering new user")

	log.Debug("validating credentials")
	if err := regexpCredentials(email, password, username); err != nil {
		log.Error("failed to validate credentials", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("hashing password")
	passHash, err := utils.HashPassword(password)
	if err != nil {
		log.Error("failed to hash password", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("checking if user exists")
	if _, err = a.usrProvider.UserEmail(ctx, email); err == nil {
		log.Error("user already exists", logger.Err(domain.ErrUserExists))
		return "", fmt.Errorf("%s: %w", op, domain.ErrUserExists)
	}

	log.Debug("saving user")
	id, err := a.usrSaver.SaveUser(ctx, email, passHash, username)
	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserExists):
			log.Error("user already exists", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, domain.ErrUserExists)
		default:
			log.Error("failed to save user", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, err)
		}
	}

	log.Info("user registered")
	return id, nil
}

var (
	emailRegex    = regexp.MustCompile(`^[\w.-]+@[\w]+\.[a-zA-Z]{2,}$`)
	passwordRegex = regexp.MustCompile(`^[a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]{};':",.<>\/?]{8,}$`)
	usernameRegex = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_]*$`)
)

// validateCredentials проверяет email и password на соответствие regexp
func regexpCredentials(email, password, username string) error {
	switch {
	case !emailRegex.MatchString(email):
		return domain.ErrInvalidEmailFormat
	case !passwordRegex.MatchString(password):
		return domain.ErrInvalidPassFormat
	case !usernameRegex.MatchString(username):
		return domain.ErrInvalidUsernameFormat
	default:
		return nil
	}
}
