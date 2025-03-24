package grpccontroller

// Сервисный слой
import (
	"context"
	"errors"

	"github.com/snowwyd/messenger/msgauth/internal/domain"

	msgauthpb "github.com/snowwyd/messenger/msgauth/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Auth (его реализация) содержится в сервисном слое (internal/services) и представляет собой основную бизнес-логику
type AuthService interface {
	Login(ctx context.Context, email string, password string) (token string, err error)
	RegisterNewUser(ctx context.Context, email string, password string, username string) (userID string, err error)
}

// все ручки сервиса

func (s *serverAPI) Login(ctx context.Context, req *msgauthpb.LoginRequest) (*msgauthpb.LoginResponse, error) {
	if err := validateLogin(req); err != nil {
		return nil, err
	}

	token, err := s.auth.Login(ctx, req.GetEmail(), req.GetPassword())

	if err != nil {
		switch {
		case errors.Is(err, domain.ErrInvalidCredentials):
			return nil, status.Error(codes.InvalidArgument, "invalid credentials")
		default:
			return nil, status.Error(codes.Internal, "login")
		}
	}

	return &msgauthpb.LoginResponse{
		Token: token,
	}, nil
}

func (s *serverAPI) Register(ctx context.Context, req *msgauthpb.RegisterRequest) (*msgauthpb.RegisterResponse, error) {
	if err := validateRegister(req); err != nil {
		return nil, err
	}

	userId, err := s.auth.RegisterNewUser(ctx, req.GetEmail(), req.GetPassword(), req.GetUsername())

	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserExists):
			return nil, status.Error(codes.InvalidArgument, "user already exists")
		case errors.Is(err, domain.ErrInvalidEmailFormat):
			return nil, status.Error(codes.InvalidArgument, "email format must be example@mail.com")
		case errors.Is(err, domain.ErrInvalidPassFormat):
			return nil, status.Error(codes.InvalidArgument, "password must be at least 8 characters long")
		case errors.Is(err, domain.ErrInvalidUsernameFormat):
			return nil, status.Error(codes.InvalidArgument, "username must contain only numbers, letters, and underscores (not first symbol)")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}
	}

	return &msgauthpb.RegisterResponse{
		UserId: userId,
	}, nil
}

// функции проверки на правильность ввода
func validateLogin(req *msgauthpb.LoginRequest) error {
	switch {
	case req.GetEmail() == "":
		return status.Error(codes.InvalidArgument, "email is required")
	case req.GetPassword() == "":
		return status.Error(codes.InvalidArgument, "password is required")
	default:
		return nil
	}
}

func validateRegister(req *msgauthpb.RegisterRequest) error {
	switch {
	case req.GetEmail() == "":
		return status.Error(codes.InvalidArgument, "email is required")
	case req.GetPassword() == "":
		return status.Error(codes.InvalidArgument, "password is required")
	case req.GetUsername() == "":
		return status.Error(codes.InvalidArgument, "username is required")
	default:
		return nil
	}
}
