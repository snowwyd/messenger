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
	UserEmail(ctx context.Context, email string) (user models.User, err error)
	UserUsername(ctx context.Context, username string) (user models.User, err error)
	IsAdmin(ctx context.Context, userID string) (bool, error)

	// Usernames - выдает множество usernames по множеству user_id
	Usernames(ctx context.Context, userIDs []string) (usernames map[string]string, err error)
	// UserIDs - выдает множество user_ids по множеству username
	UserIDs(ctx context.Context, usernames []string) (userIDs map[string]string, err error)
}

var (
	ErrInvalidCredentials = errors.New("invalid credentials")

	emailRegex    = regexp.MustCompile(`^[\w.-]+@[\w]+\.[a-zA-Z]{2,}$`)
	passwordRegex = regexp.MustCompile(`^[a-zA-Z0-9!@#\$%\^&\*\(\)_\+\-=\[\]{};':",.<>\/?]{8,}$`)
	usernameRegex = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_]*$`)

	ErrInvalidPassFormat     = errors.New("password must be at least 8 characters long")
	ErrInvalidEmailFormat    = errors.New("email format must be example@mail.com")
	ErrInvalidUsernameFormat = errors.New("username must contain only numbers, letters, and underscores (not first symbol)")

	ErrUserNotFound     = errors.New("user not found")
	ErrUserExists       = errors.New("user already exists")
	ErrUsernameNotFound = errors.New("username not found")
	ErrMissingUsernames = errors.New("missing usernames")
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

	user, err := a.usrProvider.UserEmail(ctx, email)
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

	log := a.log.With(slog.String("op", op), slog.String("email", email), slog.String("username", username))

	log.Info("registering new user")

	if err := validateCredentials(email, password, username); err != nil {
		log.Error("failed to validate credentials", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Error("failed to hash password", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	_, err = a.usrProvider.UserEmail(ctx, email)
	if err == nil {
		log.Error("user already exists", logger.Err(ErrUserExists))
		return "", fmt.Errorf("%s: %w", op, ErrUserExists)
	}

	_, err = a.usrProvider.UserUsername(ctx, username)
	if err == nil {
		log.Error("user already exists", logger.Err(ErrUserExists))
		return "", fmt.Errorf("%s: %w", op, ErrUserExists)
	}

	id, err := a.usrSaver.SaveUser(ctx, email, passHash, username)
	if err != nil {
		if errors.Is(err, ErrUserExists) {
			log.Error("user already exists", logger.Err(err))
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

func (a *Auth) GetUsernames(ctx context.Context, userIDs []string) (map[string]string, error) {
	const op = "auth.GetUsernames"
	log := a.log.With(slog.String("op", op), slog.Any("userIDs", userIDs))
	log.Info("getting usernames")

	usernames, err := a.usrProvider.Usernames(ctx, userIDs)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			log.Error("user not found", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, ErrUserNotFound)
		}
		a.log.Error("failed to get usernames", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	missingUserIDs := make([]string, 0, len(userIDs))
	for _, uid := range userIDs {
		if _, exists := usernames[uid]; !exists {
			missingUserIDs = append(missingUserIDs, uid)
		}
	}

	if len(missingUserIDs) > 0 {
		log.Warn("some user_ids were not found", slog.Any("missing_user_ids", missingUserIDs))
	}

	log.Info("usernames got successfully")
	return usernames, nil
}

func (a *Auth) GetUserIDs(ctx context.Context, usernames []string) (map[string]string, error) {
	const op = "auth.GetUserIDs"
	log := a.log.With(slog.String("op", op), slog.Any("usernames", usernames))
	log.Info("getting usernames")

	userIDs, err := a.usrProvider.UserIDs(ctx, usernames)
	if err != nil {
		if errors.Is(err, ErrUsernameNotFound) {
			log.Error("username not found", logger.Err(err))
			return nil, fmt.Errorf("%s: %w", op, ErrUsernameNotFound)
		}
		a.log.Error("failed to get usernames", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	missingUsernames := make([]string, 0, len(usernames))
	for _, username := range usernames {
		if !usernameRegex.MatchString(username) {
			a.log.Error("failed to validate usernames", logger.Err(ErrInvalidUsernameFormat))
			return nil, fmt.Errorf("%s: %w", op, ErrInvalidUsernameFormat)
		}
		if _, exists := userIDs[username]; !exists {
			missingUsernames = append(missingUsernames, username)
		}
	}

	if len(missingUsernames) > 0 {
		log.Warn("some usernames were not found", slog.Any("missing_usernames", missingUsernames))
	}

	log.Info("usernames got successfully")
	return userIDs, nil
}

// validateCredentials проверяет email и password на соответствие regexp
func validateCredentials(email, password, username string) error {
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmailFormat
	}

	if !passwordRegex.MatchString(password) {
		return ErrInvalidPassFormat
	}

	if !usernameRegex.MatchString(username) {
		return ErrInvalidUsernameFormat
	}

	return nil
}
