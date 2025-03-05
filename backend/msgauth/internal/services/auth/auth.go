package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"msgauth/internal/domain/models"
	"msgauth/internal/lib/jwt"
	"msgauth/internal/lib/logger"
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// Сервисный слой занимается бизнес-логикой
// только он может взаимодействовать с БД
// Для передачи данных между сервисным слоем и слоем работы с данными создаются модели (internal/domain)

// Auth - структура для поставления сервиса
type Auth struct {
	log         *slog.Logger
	usrSaver    UserSaver
	usrProvider UserProvider
	tokenTTL    time.Duration
	appSecret   string
}

// UserSaver ... Интерфейсы, которые будут реализованы в Storage для любых БД, разбиение для обеспечения гибкости
// минус: неудобно передавать в качестве объекта
type UserSaver interface {
	SaveUser(ctx context.Context, email string, passHash []byte, username string) (uid string, err error)
}

type UserProvider interface {
	User(ctx context.Context, email string) (user models.User, err error)
	IsAdmin(ctx context.Context, userID string) (bool, error)
}

var (
	ErrInvalidCredentials = errors.New("invalid credentials")

	emailRegex                = regexp.MustCompile(`^[\w.-]+@[\w]+\.[a-zA-Z]{2,}$`)
	passwordRegex             = regexp.MustCompile(`^[a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]{};':",.<>\/?]{8,}$`)
	ErrInvalidEmailPassFormat = errors.New("email format must be example@mail.com and password must be at least 8 characters long")

	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
)

// New - конструктор Auth сервиса
func New(log *slog.Logger, userSaver UserSaver, userProvider UserProvider, tokenTTL time.Duration, appSecret string) *Auth {
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

	fmt.Println(a.appSecret)
	token, err := jwt.NewToken(user, a.appSecret, a.tokenTTL)
	if err != nil {
		a.log.Error("failed to generate token", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	return token, nil
}

// RegisterNewUser проверяет, есть ли уже такой пользователь, если нет - возвращает новый id
func (a *Auth) RegisterNewUser(ctx context.Context, email string, password string, username string) (res string, err error) {
	const op = "auth.RegisterNewUser"

	log := a.log.With(slog.String("op", op), slog.String("email", email))

	log.Info("registering new user")

	if err := validateCredentials(email, password); err != nil {
		log.Error("failed to validate credentials", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Error("failed to hash password", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	_, err = a.usrProvider.User(ctx, email)
	if err == nil {
		return "", fmt.Errorf("%s: %w", op, ErrUserExists)
	}

	id, err := a.usrSaver.SaveUser(ctx, email, passHash, username)
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
		log.Error("failed to check if user is admin", logger.Err(err))
		return false, fmt.Errorf("%s: %w", op, err)
	}
	log.Info("checking proceed successfully", slog.Bool("isAdmin", isAdmin))
	return isAdmin, nil
}

// validateCredentials проверяет email и password на соответствие regexp
func validateCredentials(email, password string) error {
	if !emailRegex.MatchString(email) || !passwordRegex.MatchString(password) {
		return ErrInvalidEmailPassFormat
	}
	return nil
}
