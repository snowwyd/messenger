package grpccontroller

import (
	"context"
	"errors"
	"fmt"

	msgauthpb "github.com/snowwyd/messenger/msgauth/gen"
	"github.com/snowwyd/messenger/msgauth/internal/domain"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type UsersService interface {
	GetUsernames(ctx context.Context, userIDs []string) (usernames map[string]string, err error)
	GetUserIDs(ctx context.Context, usernames []string) (userIDs map[string]string, err error)
}

func (s *serverAPI) GetUsernames(ctx context.Context, req *msgauthpb.GetUsernamesRequest) (*msgauthpb.GetUsernamesResponse, error) {
	if err := validateGetUsername(req); err != nil {
		return nil, err
	}

	usernames, err := s.users.GetUsernames(ctx, req.GetUserIds())

	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUserNotFound):
			return nil, status.Error(codes.NotFound, "user not found")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}

	}
	return &msgauthpb.GetUsernamesResponse{
		Usernames: usernames,
	}, nil
}

func (s *serverAPI) GetUserIDs(ctx context.Context, req *msgauthpb.GetUserIDsRequest) (*msgauthpb.GetUserIDsResponse, error) {
	if err := validateGetUserIDs(req); err != nil {
		return nil, err
	}

	userIDs, err := s.users.GetUserIDs(ctx, req.GetUsernames())

	if err != nil {
		switch {
		case errors.Is(err, domain.ErrUsernameNotFound):
			return nil, status.Error(codes.NotFound, "username not found")
		case errors.Is(err, domain.ErrInvalidUsernameFormat):
			return nil, status.Error(codes.InvalidArgument, "username must contain only numbers, letters, and underscores (not first symbol)")
		default:
			return nil, status.Error(codes.Internal, "internal error")
		}

	}
	return &msgauthpb.GetUserIDsResponse{
		UserIds: userIDs,
	}, nil
}

// валидация
func validateGetUsername(req *msgauthpb.GetUsernamesRequest) error {
	fmt.Println(req.GetUserIds())
	switch {
	case len(req.GetUserIds()) == 0:
		return status.Error(codes.InvalidArgument, "user_ids are required")
	default:
		return nil
	}
}

func validateGetUserIDs(req *msgauthpb.GetUserIDsRequest) error {
	switch {
	case len(req.GetUsernames()) == 0:
		return status.Error(codes.InvalidArgument, "usernames are required")
	default:
		return nil
	}
}
