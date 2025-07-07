package service

import (
	"context"
	"log/slog"
	"user-service/internal/config"
	"user-service/internal/domain"
	"user-service/internal/lib/jwt"
	"user-service/internal/lib/regex"
	"user-service/internal/lib/security"
)

type AuthService struct {
	log *slog.Logger
	cfg *config.Config
	db  UserRepository
}

type UserRepository interface {
	CheckFreeSlot(ctx context.Context, email, username string) (exists bool, err error)
	SaveUser(ctx context.Context, user domain.User) (userID string, err error)

	GetUserByField(ctx context.Context, paramName string, paramValue any) (user domain.User, err error)

	UpdateUser(ctx context.Context, user domain.User) (err error)
}

func NewAuthService(
	log *slog.Logger,
	cfg *config.Config,
	db UserRepository,
) *AuthService {
	return &AuthService{
		log: log,
		cfg: cfg,
		db:  db,
	}
}

func (authService *AuthService) Register(ctx context.Context, email, password, username string) (domain.RegisterResponse, error) {
	const op = "service.auth.Register"

	log := authService.log.With(slog.String("op", op), slog.String("email", email))
	h := NewErrorHandler(log, op)

	log.Info("registering new user")

	log.Debug("validating credentials")
	if err := regex.CheckCredentials(email, password, username); err != nil {
		return domain.RegisterResponse{}, h.Handle(err)
	}

	log.Debug("checking if username and email are free in repo")
	isFree, err := authService.db.CheckFreeSlot(ctx, email, username)
	if err != nil {
		return domain.RegisterResponse{}, h.Handle(err, "check free credentials")
	}
	if !isFree {
		return domain.RegisterResponse{}, h.Handle(domain.ErrRegistered)
	}

	// TODO: 2FA

	log.Debug("hashing password")
	passHash, err := security.HashPassword(password)
	if err != nil {
		return domain.RegisterResponse{}, h.Handle(err, "hash password")
	}

	log.Debug("saving user to repo")
	user := domain.User{
		Email:    email,
		Username: username,
		PassHash: passHash,
	}
	userID, err := authService.db.SaveUser(ctx, user)
	if err != nil {
		return domain.RegisterResponse{}, h.Handle(err, "save user to repo")
	}

	log.Debug("generating jwt")
	token, err := jwt.NewToken(user, authService.cfg.DotEnv.Secrets.AppSecret, authService.cfg.Yaml.TokenTTL)
	if err != nil {
		return domain.RegisterResponse{}, h.Handle(err, "generate token")
	}

	log.Info("user registered successfully")
	return domain.RegisterResponse{
		UserID: userID,
		Token:  token,
	}, nil
}

func (authService *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	const op = "service.auth.Login"

	log := authService.log.With(slog.String("op", op), slog.String("email", email))
	h := NewErrorHandler(log, op)

	log.Info("logging user in")

	log.Debug("validating credentials")
	if err := regex.CheckCredentials(email, password, ""); err != nil {
		return "", h.Handle(err)
	}
	log.Debug("finding user in repo")
	user, err := authService.db.GetUserByField(ctx, "email", email)
	if err != nil {
		return "", h.Handle(err)
	}

	log.Debug("checking password")
	if err := security.ComparePassword(password, user.PassHash); err != nil {
		return "", h.Handle(domain.ErrInvalidCredentials)
	}

	log.Debug("generating jwt")
	token, err := jwt.NewToken(user, authService.cfg.DotEnv.Secrets.AppSecret, authService.cfg.Yaml.TokenTTL)
	if err != nil {
		return "", h.Handle(err, "generate token")
	}

	log.Info("user logged in successfully")
	return token, nil
}
