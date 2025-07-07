package domain

import "errors"

var (
	ErrInternal = errors.New("internal error")
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrRegistered   = errors.New("username or email already registered")
)

var (
	ErrInvalidPasswordFormat = errors.New("password must be at least 8 characters long")
	ErrInvalidEmailFormat    = errors.New("email format must be example@mail.com")
	ErrInvalidUsernameFormat = errors.New("username must contain only numbers, letters, and underscores (not first symbol)")

	ErrInvalidCredentials = errors.New("invalid credentials")
)

var (
	ErrRequireEmail    = errors.New("email is required")
	ErrRequireUsername = errors.New("username is required")
	ErrRequirePassword = errors.New("password is required")

	ErrRequireUsernames = errors.New("usernames are required")
	ErrRequireUserIDs   = errors.New("user_ids are required")
)
