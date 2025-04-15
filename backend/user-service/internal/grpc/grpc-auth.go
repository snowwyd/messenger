package grpccontroller

import (
	"context"

	userpb "user-service/gen"
	"user-service/internal/domain"
)

func (s *serverAPI) Login(ctx context.Context, req *userpb.LoginRequest) (*userpb.LoginResponse, error) {
	if err := validateLogin(req); err != nil {
		return nil, err
	}

	token, err := s.auth.Login(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, getStatusError(err)
	}

	return &userpb.LoginResponse{
		Token: token,
	}, nil
}

func validateLogin(req *userpb.LoginRequest) error {
	switch {
	case req.GetEmail() == "":
		return getStatusError(domain.ErrRequireEmail)
	case req.GetPassword() == "":
		return getStatusError(domain.ErrRequirePassword)
	default:
		return nil
	}
}

func (s *serverAPI) Register(ctx context.Context, req *userpb.RegisterRequest) (*userpb.RegisterResponse, error) {
	if err := validateRegister(req); err != nil {
		return nil, err
	}

	userId, err := s.auth.RegisterNewUser(ctx, req.GetEmail(), req.GetPassword(), req.GetUsername())
	if err != nil {
		return nil, getStatusError(err)
	}

	return &userpb.RegisterResponse{
		UserId: userId,
	}, nil
}

func validateRegister(req *userpb.RegisterRequest) error {
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
