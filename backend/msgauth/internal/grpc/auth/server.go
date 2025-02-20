package auth

// Сервисный слой
import (
	"context"
	"errors"
	msgv1 "github.com/snowwyd/protos/gen/go/msgauth"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"log"
	"log/slog"
	"msgauth/internal/services/auth"
)

const (
	emptyValue = 0
)

// Auth (его реализация) содержится в сервисном слое (internal/services) и представляет собой основную бизнес-логику
type Auth interface {
	Login(ctx context.Context, email string, password string, appID int) (token string, err error)
	RegisterNewUser(ctx context.Context, email string, password string) (err error)
	IsAdmin(ctx context.Context, email string) (isAdmin bool, err error)
}

// serverAPI обрабатывает все входящие запросы
type serverAPI struct {
	// UnimplementedAuthServer делает автоматически заглушки для неимплементированных ручек
	msgv1.UnimplementedAuthServer
	auth Auth // сервис
}

func Register(gRPC *grpc.Server, auth Auth) {
	msgv1.RegisterAuthServer(gRPC, &serverAPI{auth: auth}) // добавляет в grpc сервер сервис auth
}

// все ручки сервиса

func (s *serverAPI) Login(ctx context.Context, req *msgv1.LoginRequest) (*msgv1.LoginResponse, error) {
	if err := validateLogin(req); err != nil {
		return nil, err
	}

	token, err := s.auth.Login(ctx, req.GetEmail(), req.GetPassword(), int(req.GetAppId()))
	if err != nil {
		if errors.Is(err, auth.ErrInvalidCredentials) {
			return nil, status.Error(codes.InvalidArgument, "invalid credentials")
		}

		slog.Error("login failed", "error", err)
		return nil, status.Error(codes.Internal, "login") // "internal error" для сокрытия подробностей ошибки от клиента
	}

	return &msgv1.LoginResponse{
		Token: token,
	}, nil
}

func (s *serverAPI) Register(ctx context.Context, req *msgv1.RegisterRequest) (*msgv1.RegisterResponse, error) {
	if err := validateRegister(req); err != nil {
		return nil, err
	}

	err := s.auth.RegisterNewUser(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		if errors.Is(err, auth.ErrUserExists) {
			return nil, status.Error(codes.InvalidArgument, "user already exists")
		}

		return nil, status.Error(codes.Internal, "internal error")
	}

	return &msgv1.RegisterResponse{
		UserId: 1,
	}, nil
}

func (s *serverAPI) IsAdmin(ctx context.Context, req *msgv1.IsAdminRequest) (*msgv1.IsAdminResponse, error) {
	log.Printf("Checking admin for email: %s", req.Email)
	if err := validateIsAdmin(req); err != nil {
		return nil, err
	}

	isAdmin, err := s.auth.IsAdmin(ctx, req.GetEmail())
	if err != nil {
		if errors.Is(err, auth.ErrUserNotFound) {
			return nil, status.Error(codes.NotFound, "user not found")
		}

		return nil, status.Error(codes.Internal, "internal error")
	}
	return &msgv1.IsAdminResponse{
		IsAdmin: isAdmin,
	}, nil
}

// функции проверки на правильность ввода
func validateLogin(req *msgv1.LoginRequest) error {
	if req.GetEmail() == "" {
		return status.Error(codes.InvalidArgument, "email is required")
	}

	if req.GetPassword() == "" {
		return status.Error(codes.InvalidArgument, "password is required")
	}

	if req.GetAppId() == emptyValue {
		return status.Error(codes.InvalidArgument, "appId is required")
	}
	return nil
}

func validateRegister(req *msgv1.RegisterRequest) error {
	if req.GetEmail() == "" {
		return status.Error(codes.InvalidArgument, "email is required")
	}

	if req.GetPassword() == "" {
		return status.Error(codes.InvalidArgument, "password is required")
	}
	return nil
}

func validateIsAdmin(req *msgv1.IsAdminRequest) error {

	if req.GetEmail() == "" {
		return status.Error(codes.InvalidArgument, "email is required")
	}
	return nil
}
