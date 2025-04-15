package domain

import "errors"

var ErrInternal = errors.New("internal error")

var (
	ErrInvalidCredentials = errors.New("invalid credentials")

	ErrInvalidPassFormat     = errors.New("password must be at least 8 characters long")
	ErrInvalidEmailFormat    = errors.New("email format must be example@mail.com")
	ErrInvalidUsernameFormat = errors.New("username must contain only numbers, letters, and underscores (not first symbol)")

	ErrUserNotFound     = errors.New("user not found")
	ErrUserExists       = errors.New("user already exists")
	ErrUsernameNotFound = errors.New("username not found")
	ErrMissingUsernames = errors.New("missing usernames")
)

var (
	ErrRequireEmail    = errors.New("email is required")
	ErrRequireUsername = errors.New("username is required")
	ErrRequirePassword = errors.New("password is required")

	ErrRequireUsernames = errors.New("usernames are required")
	ErrRequireUserIDs   = errors.New("user_ids are required")
)
