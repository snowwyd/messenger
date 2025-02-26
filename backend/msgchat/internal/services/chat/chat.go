package chat

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"msgchat/internal/domain/models"
	"msgchat/internal/lib/logger"
	"slices"
	"time"
)

type Chat struct {
	log          *slog.Logger
	msgSaver     MessageSaver
	msgProvider  MessageProvider
	chatSaver    ChatSaver
	chatProvider ChatProvider
	tokenTTL     time.Duration
}

type MessageSaver interface {
	SaveMessage(ctx context.Context, senderID string, chatID string, text string, timestamp time.Time) (messageID string, err error)
	DeleteMessage(ctx context.Context, messageID string) error
}

type ChatSaver interface {
	SaveChat(ctx context.Context, userIDs []string) (chatID string, err error)
}

type MessageProvider interface {
	Messages(ctx context.Context, chatID string, limit int32, offset int32) (messages []models.Message, err error)
}

type ChatProvider interface {
	// Chat возвращает chat по его id
	Chat(ctx context.Context, chatID string) (chat models.Chat, err error)
	// Chats возвращает чаты пользователя по user_id
	Chats(ctx context.Context, userID string) (chats []models.Chat, err error)
}

// New - конструктор Chat
func New(log *slog.Logger, messageSaver MessageSaver, messageProvider MessageProvider, chatSaver ChatSaver, chatProvider ChatProvider, tokenTTL time.Duration) *Chat {
	return &Chat{
		msgSaver:     messageSaver,
		msgProvider:  messageProvider,
		chatSaver:    chatSaver,
		chatProvider: chatProvider,
		log:          log,
		tokenTTL:     tokenTTL,
	}
}

var (
	ErrEmptyMessage   = errors.New("message cannot be empty")
	ErrMessageTooLong = errors.New("message length must be less than 1000 symbols")

	ErrChatNotFound    = errors.New("chat not found")
	ErrUserOutsideChat = errors.New("user is not in a chat")
)

// SendMessage отправляет сообщение в чат
func (c *Chat) SendMessage(ctx context.Context, senderID string, chatID string, text string) (string, error) {
	const op = "chat.SendMessage"

	log := c.log.With(slog.String("op", op), slog.String("chatID", chatID))
	log.Info("sending message")

	if err := validateMessage(text); err != nil {
		if errors.Is(err, ErrEmptyMessage) {
			c.log.Warn("empty message", logger.Err(err))
			return "", fmt.Errorf("%s: %w", op, ErrEmptyMessage)
		}
		c.log.Warn("message is too long", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, ErrMessageTooLong)
	}

	// проверка на существование чата
	chat, err := c.chatProvider.Chat(ctx, chatID)
	if err != nil {
		c.log.Error("chat not found", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, ErrChatNotFound)
	}

	// проверка на то, состит ли пользователь в чате
	isMember := slices.Contains(chat.UserIDs, senderID)
	if !isMember {
		c.log.Warn("unauthorized message attempt", "senderID", senderID, "chatID", chatID)
		return "", fmt.Errorf("%s: %w", op, ErrUserOutsideChat)
	}

	// получение времени отправки сообщения и сохранение сообщения в базе через метод SaveMessage
	timestamp := time.Now()
	messageID, err := c.msgSaver.SaveMessage(ctx, senderID, chatID, text, timestamp)
	if err != nil {
		c.log.Error("failed to save message", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	return messageID, nil
}

// GetMessages получает сообщения из чата с пагинацией
func (c *Chat) GetMessages(ctx context.Context, chatID string, limit int32, offset int32) ([]*models.Message, error) {
	panic("GetMessages is not implemented yet")
}

// CreateChat создает новый чат между пользователями
func (c *Chat) CreateChat(ctx context.Context, userIDs []string) (string, error) {
	panic("CreateChat is not implemented yet")
}

// GetUserChats получает список чатов, в которых состоит пользователь
func (c *Chat) GetUserChats(ctx context.Context, userID string) ([]*models.Chat, error) {
	panic("GetUserChats is not implemented yet")
}

// DeleteMessage удаляет сообщение по ID
func (c *Chat) DeleteMessage(ctx context.Context, messageID string) (bool, error) {
	panic("DeleteMessage is not implemented yet")
}

func validateMessage(text string) error {
	const maxLength = 1000
	if len(text) == 0 {
		return ErrEmptyMessage
	}
	if len(text) > maxLength {
		return ErrMessageTooLong
	}
	return nil
}
