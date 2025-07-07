package handler

import (
	"context"
	userpb "user-service/gen/v1"
	"user-service/internal/domain"
)

type AuthService interface {
	Login(ctx context.Context, email, password string) (token string, err error)
	Register(ctx context.Context, email, password, username string) (response domain.RegisterResponse, err error)
}

func (s *serverAPI) Login(ctx context.Context, req *userpb.Auth_Login_Request) (*userpb.Auth_Login_Response, error) {
	if err := validateLogin(req); err != nil {
		return nil, err
	}

	token, err := s.authService.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, getStatusError(err)
	}

	return &userpb.Auth_Login_Response{
		Token: token,
	}, nil
}

func validateLogin(req *userpb.Auth_Login_Request) error {
	switch {
	case req.GetEmail() == "":
		return getStatusError(domain.ErrRequireEmail)
	case req.GetPassword() == "":
		return getStatusError(domain.ErrRequirePassword)
	default:
		return nil
	}
}

func (s *serverAPI) Register(ctx context.Context, req *userpb.Auth_Register_Request) (*userpb.Auth_Register_Response, error) {
	if err := validateRegister(req); err != nil {
		return nil, err
	}

	resp, err := s.authService.Register(ctx, req.GetEmail(), req.GetPassword(), req.GetUsername())
	if err != nil {
		return nil, getStatusError(err)

	}

	return &userpb.Auth_Register_Response{
		UserId: resp.UserID,
		Token:  resp.Token,
	}, nil
}

func validateRegister(req *userpb.Auth_Register_Request) error {
	switch {
	case req.GetEmail() == "":
		return getStatusError(domain.ErrRequireEmail)
	case req.GetPassword() == "":
		return getStatusError(domain.ErrRequirePassword)
	case req.GetUsername() == "":
		return getStatusError(domain.ErrRequireUsername)
	default:
		return nil
	}
}
