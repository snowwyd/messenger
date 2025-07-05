package grpccontroller

import (
	"context"

	userpb "user-service/gen"
	"user-service/internal/domain"
)

func (s *serverAPI) GetUsernames(ctx context.Context, req *userpb.GetUsernamesRequest) (*userpb.GetUsernamesResponse, error) {
	if err := validateGetUsername(req); err != nil {
		return nil, err
	}

	usernames, err := s.users.GetStrings(ctx, req.GetUserIds(), "user_ids")
	if err != nil {
		return nil, getStatusError(err)
	}

	return &userpb.GetUsernamesResponse{
		Usernames: usernames,
	}, nil
}

func validateGetUsername(req *userpb.GetUsernamesRequest) error {
	switch {
	case len(req.GetUserIds()) == 0:
		return getStatusError(domain.ErrRequireUserIDs)
	default:
		return nil
	}
}

func (s *serverAPI) GetUserIDs(ctx context.Context, req *userpb.GetUserIDsRequest) (*userpb.GetUserIDsResponse, error) {
	if err := validateGetUserIDs(req); err != nil {
		return nil, err
	}

	userIDs, err := s.users.GetStrings(ctx, req.GetUsernames(), "usernames")
	if err != nil {
		return nil, getStatusError(err)
	}

	return &userpb.GetUserIDsResponse{
		UserIds: userIDs,
	}, nil
}

func validateGetUserIDs(req *userpb.GetUserIDsRequest) error {
	switch {
	case len(req.GetUsernames()) == 0:
		return getStatusError(domain.ErrRequireUsernames)
	default:
		return nil
	}
}
