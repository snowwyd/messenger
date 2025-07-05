package handler

import (
	"context"
	userpb "user-service/gen/v1"
	"user-service/internal/domain"

	"google.golang.org/protobuf/types/known/emptypb"
)

type UsersService interface {
	GetUserByUsername(ctx context.Context, username string) (user domain.User, err error)
	GetUserByUserID(ctx context.Context, userID string) (user domain.User, err error)
	UpdateUsername(ctx context.Context, username string) (err error)
}

func (s *serverAPI) GetUserByUsername(ctx context.Context, req *userpb.User_GetByUsername_Request) (*userpb.User_GetByUsername_Response, error) {
	// TODO: validation

	user, err := s.userService.GetUserByUsername(ctx, req.GetUsername())
	if err != nil {
		// TODO: custom error logic
	}

	return &userpb.User_GetByUsername_Response{
		UserId:   user.ID,
		Username: user.Username,
	}, nil
}

func (s *serverAPI) GetUserByUserID(ctx context.Context, req *userpb.User_GetByUserID_Request) (*userpb.User_GetByUserID_Response, error) {
	// TODO: validation

	user, err := s.userService.GetUserByUserID(ctx, req.GetUserId())
	if err != nil {
		// TODO: custom error logic
	}

	return &userpb.User_GetByUserID_Response{
		UserId:   user.ID,
		Username: user.Username,
	}, nil
}

// TODO: пока что будет JWT проверяется внутри метода. Когда методов станет больше - будет реализован интерцептор с фильтрацией
func (s *serverAPI) UpdateUsername(ctx context.Context, req *userpb.User_UpdateUsername_Request) (*emptypb.Empty, error) {
	// TODO: validation

	if err := s.userService.UpdateUsername(ctx, req.GetUsername()); err != nil {
		// TODO: custom error logic
	}

	return &emptypb.Empty{}, nil
}
