package auth

import (
	"context"
	"errors"
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"log/slog"
	"msgauth/internal/domain/models"
	"msgauth/internal/lib/jwt"
	"msgauth/internal/lib/logger"
	"time"
)

// Сервисный слой занимается бизнес-логикой
// только он может взаимодействовать с БД
// Для передачи данных между сервисным слоем и слоем работы с данными создаются модели (internal/domain)

// Auth - структура для поставления сервиса
type Auth struct {
	log         *slog.Logger
	usrSaver    UserSaver
	usrProvider UserProvider
	appProvider AppProvider
	tokenTTL    time.Duration
}

// UserSaver ... Интерфейсы, которые будут реализованы в Storage для любых БД, разбиение для обеспечения гибкости
// минус: неудобно передавать в качестве объекта
type UserSaver interface {
	SaveUser(ctx context.Context, email string, passHash []byte) (uid string, err error)
}

type UserProvider interface {
	User(ctx context.Context, email string) (user models.User, err error)
	IsAdmin(ctx context.Context, userID string) (bool, error)
}

type AppProvider interface {
	App(ctx context.Context, appID string) (app models.App, err error)
}

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidAppID       = errors.New("invalid app id")

	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
	ErrAppNotFound  = errors.New("app not found")
)

// New - конструктор Auth сервиса
func New(log *slog.Logger, userSaver UserSaver, userProvider UserProvider, appProvider AppProvider, tokenTTL time.Duration) *Auth {
	return &Auth{
		log:         log,
		usrSaver:    userSaver,
		usrProvider: userProvider,
		appProvider: appProvider,
		tokenTTL:    tokenTTL,
	}
}

// Login проверяет, есть ли User с предоставленными данными в системе
func (a *Auth) Login(ctx context.Context, email string, password string, appID string) (string, error) {
	const op = "auth.Login"

	log := a.log.With(slog.String("op", op), slog.String("email", email))

	log.Info("logging user in")

	user, err := a.usrProvider.User(ctx, email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			a.log.Warn("user not found", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, ErrInvalidCredentials)
		}
		a.log.Error("failed to get user", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, ErrInvalidCredentials)
	}

	if err := bcrypt.CompareHashAndPassword(user.PassHash, []byte(password)); err != nil {
		a.log.Info("invalid credentials", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, ErrInvalidCredentials)
	}

	app, err := a.appProvider.App(ctx, appID)

	if err != nil {
		return "", fmt.Errorf("%s: %w", op, err)
	}
	log.Info("logged user in successfully")

	token, err := jwt.NewToken(user, app, a.tokenTTL)
	if err != nil {
		a.log.Error("failed to generate token", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	return token, nil
}

// RegisterNewUser проверяет, есть ли уже такой пользователь, если нет - возвращает новый id
func (a *Auth) RegisterNewUser(ctx context.Context, email string, password string) (res string, err error) {
	const op = "auth.RegisterNewUser"

	log := a.log.With(slog.String("op", op), slog.String("email", email))

	log.Info("registering new user")

	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Error("failed to hash password", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	_, err = a.usrProvider.User(ctx, email)
	if err == nil {
		return "", fmt.Errorf("%s: %w", op, ErrUserExists)
	}
	
	id, err := a.usrSaver.SaveUser(ctx, email, passHash)
	if err != nil {
		if errors.Is(err, ErrUserExists) {
			a.log.Warn("user already exists", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, ErrUserExists)
		}

		log.Error("failed to save user", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	log.Info("user registered")
	return id, nil
}

// IsAdmin проверяет, существует ли пользователь и является ли он админом, результат проверки возвращается
func (a *Auth) IsAdmin(ctx context.Context, userID string) (bool, error) {
	const op = "auth.IsAdmin"

	log := a.log.With(slog.String("op", op), slog.String("userID", userID))

	log.Info("checking if user is admin")

	isAdmin, err := a.usrProvider.IsAdmin(ctx, userID)

	if err != nil {
		if errors.Is(err, ErrAppNotFound) {
			a.log.Warn("user not found", logger.Err(err))
			return false, fmt.Errorf("%s: %w", op, ErrInvalidAppID)
		}
		log.Error("failed to check if user is admin", logger.Err(err))
		return false, fmt.Errorf("%s: %w", op, err)
	}
	log.Info("checking proceed successfully", slog.Bool("isAdmin", isAdmin))
	return isAdmin, nil
}
