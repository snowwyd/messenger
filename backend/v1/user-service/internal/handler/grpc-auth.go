package handler

import (
	"context"
	userpb "user-service/gen/v1"
)

type AuthService interface {
	Login(ctx context.Context, email, password string) (token string, err error)
	Register(ctx context.Context, email, password, username string) (response RegisterResponse, err error)
}

func (s *serverAPI) Login(ctx context.Context, req *userpb.Auth_Login_Request) (*userpb.Auth_Login_Response, error) {
	// TODO: validate

	token, err := s.authService.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		// TODO: custom error logic
	}

	return &userpb.Auth_Login_Response{
		Token: token,
	}, nil
}

type RegisterResponse struct {
	userID string
	token  string
}

func (s *serverAPI) Register(ctx context.Context, req *userpb.Auth_Register_Request) (*userpb.Auth_Register_Response, error) {
	// TODO: validate

	resp, err := s.authService.Register(ctx, req.GetEmail(), req.GetPassword(), req.GetUsername())
	if err != nil {
		// TODO: custom error logic
	}

	return &userpb.Auth_Register_Response{
		UserId: resp.userID,
		Token:  resp.token,
	}, nil
}
