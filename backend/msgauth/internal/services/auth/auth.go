package auth

import (
	"context"
	"log/slog"
	"msgauth/internal/domain/models"
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
	SaveUser(ctx context.Context, email string, passHash []byte) (uid int64, err error)
}

type UserProvider interface {
	User(ctx context.Context, email string) (user models.User, err error)
	IsAdmin(ctx context.Context, userID int64) (bool, error)
}

type AppProvider interface {
	App(ctx context.Context, appID int) (app models.App, err error)
}

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
func (a *Auth) Login(ctx context.Context, email string, password string, appID int) (string, error) {
	panic("implement me")
}

// RegisterNewUser проверяет, есть ли уже такой пользователь, если нет - возвращает новый id
func (a *Auth) RegisterNewUser(ctx context.Context, email string, password string) (int64, error) {
	panic("implement me")
}

// IsAdmin проверяет, существует ли пользователь и является ли он админом, результат проверки возвращается
func (a *Auth) IsAdmin(ctx context.Context, userID int64) (bool, error) {
	panic("implement me")
}
