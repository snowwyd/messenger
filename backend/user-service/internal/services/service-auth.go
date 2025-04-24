package services

import (
	"context"
	"errors"
	"log/slog"
	"regexp"
	"time"

	"user-service/internal/domain"
	"user-service/internal/domain/interfaces"
	"user-service/internal/lib/utils"
)

type Auth struct {
	log         *slog.Logger
	usrSaver    interfaces.UserSaver
	usrProvider interfaces.UserProvider
	tokenTTL    time.Duration
	appSecret   string
}

func NewAuthService(
	log *slog.Logger,
	userSaver interfaces.UserSaver,
	userProvider interfaces.UserProvider,
	tokenTTL time.Duration,
	appSecret string,
) *Auth {
	return &Auth{
		log:         log,
		usrSaver:    userSaver,
		usrProvider: userProvider,
		tokenTTL:    tokenTTL,
		appSecret:   appSecret,
	}
}

func (authService *Auth) Login(ctx context.Context, email string, password string) (string, error) {
	const op = "services.auth.Login"

	log := authService.log.With(slog.String("op", op), slog.String("email", email))
	log.Info("logging user in")

	log.Debug("getting user by email")
	user, err := authService.usrProvider.GetUserByField(ctx, email, "email")
	if err != nil {
		return "", handleServiceError(err, op, "get user by email", log)
	}

	log.Debug("checking credentials")
	if err := utils.CheckPassword(user, password); err != nil {
		return "", handleServiceError(domain.ErrInvalidCredentials, op, "check credentials", log)
	}

	log.Debug("generating token")
	token, err := utils.NewToken(user, authService.appSecret, authService.tokenTTL)
	if err != nil {
		return "", handleServiceError(err, op, "generate token", log)
	}

	log.Info("user logged in successfully")
	return token, nil
}

func (authService *Auth) RegisterNewUser(ctx context.Context, email string, password string, username string) (res string, err error) {
	const op = "services.auth.RegisterNewUser"

	log := authService.log.With(slog.String("op", op), slog.String("email", email), slog.String("username", username))

	log.Info("registering new user")

	log.Debug("validating credentials")
	if err := regexpCredentials(email, password, username); err != nil {
		return "", handleServiceError(err, op, "validate credentials", log)
	}

	log.Debug("hashing password")
	passHash, err := utils.HashPassword(password)
	if err != nil {
		return "", handleServiceError(err, op, "hash password", log)
	}

	log.Debug("checking if user exists")
	user, err := authService.usrProvider.GetUserByField(ctx, email, "email")
	if user.ID != "" {
		return "", handleServiceError(domain.ErrUserExists, op, "get user by email", log)
	}
	if err != nil && !errors.Is(err, domain.ErrUserNotFound) {
		return "", handleServiceError(err, op, "get user by email", log)
	}

	log.Debug("saving user")
	id, err := authService.usrSaver.SaveUser(ctx, email, passHash, username)
	if err != nil {
		return "", handleServiceError(err, op, "save user", log)
	}

	log.Info("user registered")
	return id, nil
}

var (
	emailRegex    = regexp.MustCompile(`^[\w.-]+@[\w]+\.[a-zA-Z]{2,}$`)
	passwordRegex = regexp.MustCompile(`^[a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]{};':",.<>\/?]{8,}$`)
	usernameRegex = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_]*$`)
)

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
