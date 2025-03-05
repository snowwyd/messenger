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

	msgv1chat "github.com/snowwyd/protos/gen/go/messenger/msgchat"
)

type Chat struct {
	log          *slog.Logger
	msgSaver     MessageSaver
	msgProvider  MessageProvider
	chatSaver    ChatSaver
	chatProvider ChatProvider
	tokenTTL     time.Duration
	appSecret    string
}

type MessageSaver interface {
	SaveMessage(ctx context.Context, senderID string, chatID string, text string, timestamp time.Time) (messageID string, err error)
	DeleteMessage(ctx context.Context, messageID string) (bool, error)
}

type ChatSaver interface {
	SaveChat(ctx context.Context, userIDs []string) (chatID string, err error)
}

type MessageProvider interface {
	Message(ctx context.Context, messageID string) (message models.Message, err error)
	Messages(ctx context.Context, chatID string, limit int32, offset int32) (message []*models.Message, err error)
}

type ChatProvider interface {
	// Chat возвращает chat по его id
	Chat(ctx context.Context, chatID string) (chat models.Chat, err error)
	// Chats возвращает чаты пользователя по user_id
	Chats(ctx context.Context, userID string) (chats []*models.Chat, err error)
}

// New - конструктор Chat
func New(log *slog.Logger, messageSaver MessageSaver, messageProvider MessageProvider, chatSaver ChatSaver, chatProvider ChatProvider, tokenTTL time.Duration, appSecret string) *Chat {
	return &Chat{
		msgSaver:     messageSaver,
		msgProvider:  messageProvider,
		chatSaver:    chatSaver,
		chatProvider: chatProvider,
		log:          log,
		tokenTTL:     tokenTTL,
		appSecret:    appSecret,
	}
}

var (
	ErrMsgNotFound    = errors.New("message not found")
	ErrEmptyMessage   = errors.New("message cannot be empty")
	ErrMessageTooLong = errors.New("message length must be less than 1000 symbols")

	ErrChatNotFound    = errors.New("chat not found")
	ErrUserOutsideChat = errors.New("user is not in a chat")
	ErrNotEnoughUsers  = errors.New("not enough users to create the chat")
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

	c.log.Info("message sent successfully")
	return messageID, nil
}

// GetMessages получает сообщения из чата с пагинацией
func (c *Chat) GetMessages(ctx context.Context, chatID string, limit int32, offset int32) ([]*msgv1chat.Message, error) {
	const op = "chat.GetMessages"

	// TODO: возможно сделать преаллокацию для производительности

	log := c.log.With(slog.String("op", op), slog.String("chatID", chatID))
	log.Info("getting messages")

	// проверка существования чата
	_, err := c.chatProvider.Chat(ctx, chatID)
	if err != nil {
		c.log.Error("chat not found", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, ErrChatNotFound)
	}

	// в слое работы с данными будет сортировка по Timestamp, а также пагинация с SetLimit(limit) и Skip(offset)
	messages, err := c.msgProvider.Messages(ctx, chatID, limit, offset)
	if err != nil {
		c.log.Error("failed to get messages", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	protoMessages := models.ConvertMessagesToProto(messages)

	c.log.Info("messages got successfully")
	return protoMessages, nil
}

// CreateChat создает новый чат между пользователями
func (c *Chat) CreateChat(ctx context.Context, userIDs []string) (string, error) {
	const op = "chat.CreateChat"

	log := c.log.With(slog.String("op", op))
	log.Info("creating chat")

	// TODO: проверка на ID пользователей
	if len(userIDs) < 1 {
		c.log.Error("failed to create chat: not enough users")
		return "", fmt.Errorf("%s: %w", op, ErrNotEnoughUsers)
	}

	chatID, err := c.chatSaver.SaveChat(ctx, userIDs)
	if err != nil {
		c.log.Error("failed to save chat", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	timestamp := time.Now()
	// TODO: убрать хардкод
	_, err = c.msgSaver.SaveMessage(ctx, userIDs[0], chatID, "started new chat", timestamp)
	if err != nil {
		c.log.Error("failed to start new chat", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	c.log.Info("chat created successfully")
	return chatID, nil
}

// GetUserChats получает список чатов, в которых состоит пользователь
func (c *Chat) GetUserChats(ctx context.Context, userID string) ([]*msgv1chat.ChatInfo, error) {
	const op = "chat.GetUserChats"

	log := c.log.With(slog.String("op", op), slog.String("userID", userID))
	log.Info("getting user chats")

	// проверка на UserID произойдет в слое работы с данными
	chats, err := c.chatProvider.Chats(ctx, userID)
	if err != nil {
		log.Error("failed to get user chats", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	protoChats := models.ConvertChatsToProto(chats)

	log.Info("provided user chats successfully")
	return protoChats, nil
}

// DeleteMessage удаляет сообщение по ID
func (c *Chat) DeleteMessage(ctx context.Context, messageID string) (bool, error) {
	const op = "chat.DeleteMessage"

	log := c.log.With(slog.String("op", op), slog.String("messageID", messageID))
	log.Info("deleting message")

	success, err := c.msgSaver.DeleteMessage(ctx, messageID)
	if err != nil {
		log.Error("failed deleting message", logger.Err(err))
		return false, fmt.Errorf("%s: %w", op, err)
	}
	if !success {
		// Если сообщение не найдено, логируем предупреждение
		c.log.Warn("message not found", slog.String("messageID", messageID))
		return false, fmt.Errorf("%s: %w", op, ErrMsgNotFound)
	}

	log.Info("deleted message successfully")
	return true, nil
}

func validateMessage(text string) error {
	// TODO: вынести хардкод
	const maxLength = 1000
	if len(text) == 0 {
		return ErrEmptyMessage
	}
	if len(text) > maxLength {
		return ErrMessageTooLong
	}
	return nil
}
