package domain

import "errors"

var (
	ErrMsgNotFound     = errors.New("message not found")
	ErrChatNotFound    = errors.New("chat not gound")
	ErrChannelNotFound = errors.New("channel not found")

	ErrChatExists = errors.New("chat already exists")
	ErrSameUser   = errors.New("cannot create chat with same user")

	ErrAccessDenied = errors.New("access denied")

	ErrEmptyGroupName = errors.New("group name is empty")

	ErrInvalidChannelType          = errors.New("invalid channel type")
	ErrInvalidChatType             = errors.New("invalid chat type")
	ErrInvalidUserCountPrivateChat = errors.New("chat type and user_ids count mismatch")
	ErrInvalidMessage              = errors.New("invalid message format")
	ErrInvalidPage                 = errors.New("invalid pagination params")
)
