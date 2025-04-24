package grpccontroller

import (
	"errors"
	"user-service/internal/domain"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func getStatusError(err error) error {
	switch {
	case errors.Is(err, domain.ErrInvalidCredentials):
		return status.Error(codes.InvalidArgument, "invalid credentials")

	case errors.Is(err, domain.ErrUserExists):
		return status.Error(codes.AlreadyExists, "user already exists")

	case errors.Is(err, domain.ErrUserNotFound):
		return status.Error(codes.NotFound, "user not found")
	case errors.Is(err, domain.ErrUsernameNotFound):
		return status.Error(codes.NotFound, "username not found")

	case errors.Is(err, domain.ErrInvalidEmailFormat):
		return status.Error(codes.InvalidArgument, "email format must be example@mail.com")
	case errors.Is(err, domain.ErrInvalidPassFormat):
		return status.Error(codes.InvalidArgument, "password must be at least 8 characters long")
	case errors.Is(err, domain.ErrInvalidUsernameFormat):
		return status.Error(codes.InvalidArgument, "username must contain only numbers, letters, and underscores (not first symbol)")

	case errors.Is(err, domain.ErrRequireEmail):
		return status.Error(codes.InvalidArgument, "email is required")
	case errors.Is(err, domain.ErrRequireUsername):
		return status.Error(codes.InvalidArgument, "username is required")
	case errors.Is(err, domain.ErrRequirePassword):
		return status.Error(codes.InvalidArgument, "password is required")
	case errors.Is(err, domain.ErrRequireUsernames):
		return status.Error(codes.InvalidArgument, "usernames are required")
	case errors.Is(err, domain.ErrRequireUserIDs):
		return status.Error(codes.InvalidArgument, "user_ids are required")

	default:
		return status.Error(codes.Internal, "internal error")
	}

}
