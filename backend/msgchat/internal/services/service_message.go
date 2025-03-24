package services

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sync"
	"time"

	msgv1chat "github.com/snowwyd/messenger/msgchat/gen"
	"github.com/snowwyd/messenger/msgchat/internal/domain"
	"github.com/snowwyd/messenger/msgchat/internal/domain/interfaces"
	"github.com/snowwyd/messenger/msgchat/internal/lib/logger"
	"github.com/snowwyd/messenger/msgchat/internal/lib/mapper"
	"github.com/snowwyd/messenger/msgchat/internal/lib/utils"
)

type Message struct {
	log              *slog.Logger
	chatProvider     interfaces.ChatProvider
	channelProvider  interfaces.ChannelProvider
	messageProvider  interfaces.MessageProvider
	maxMessageLength int

	subscriptions map[string][]chan *msgv1chat.ChatStreamResponse
	mu            sync.Mutex
}

// New - конструктор Chat
func NewMessageService(log *slog.Logger, chatProvider interfaces.ChatProvider, channelProvider interfaces.ChannelProvider, messageProvider interfaces.MessageProvider, maxMessageLength int) *Message {
	return &Message{
		log:              log,
		chatProvider:     chatProvider,
		channelProvider:  channelProvider,
		messageProvider:  messageProvider,
		maxMessageLength: maxMessageLength,

		subscriptions: make(map[string][]chan *msgv1chat.ChatStreamResponse),
	}
}

// SendMessage проверяет, есть ли пользователь в чате, где есть ChannelID и затем сохраняет сообщение в базу, а его айди в соотв. канал
func (m *Message) SendMessage(ctx context.Context, channelID string, text string) (string, error) {
	const op = "services.chat.SendMessage"

	log := m.log.With(slog.String("op", op), slog.String("channel_id", channelID))
	log.Info("sending message")

	// Получение user_id из контекста
	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	// Валидация прав доступа к каналу
	if err := m.channelValidation(ctx, log, channelID, userID); err != nil {
		log.Error("failed channel validation", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	// Проверка длины сообщения
	log.Debug("vaildating request body")
	if len(text) > m.maxMessageLength {
		log.Error("invalid message length", logger.Err(domain.ErrInvalidMessage))
		return "", fmt.Errorf("%s: %w", op, domain.ErrInvalidMessage)
	}

	// Создание нового сообщения
	createdAt := time.Now()
	newMessage := domain.Message{
		ChannelID: channelID,
		Text:      text,
		SenderID:  userID,
		CreatedAt: createdAt,
	}

	// Сохранение сообщения в БД
	log.Debug("saving message")
	if newMessage.ID, err = m.messageProvider.SaveMessage(ctx, newMessage); err != nil {
		log.Error("failed to save message", logger.Err(err))
		return "", fmt.Errorf("%s: %w", op, err)
	}

	// Преобразование сообщения в формат gRPC
	protoMessage := mapper.ConvertMessageToProto(&newMessage)

	// Создание события о новом сообщении
	log.Debug("adding new message event")
	event := &msgv1chat.ChatStreamResponse{
		Payload: &msgv1chat.ChatStreamResponse_NewMessage{
			NewMessage: protoMessage,
		},
	}

	// Рассылка события всем подписчикам канала
	log.Debug("publishing event")
	m.mu.Lock()
	subscribers := m.subscriptions[channelID]
	for _, subscriber := range subscribers {
		select {
		case subscriber <- event:
		default:
			// Если канал заблокирован, пропускаем (защита от блокировки)
			log.Warn("failed to send event to subscriber", slog.String("channel_id", channelID))
		}
	}
	m.mu.Unlock()

	log.Info("message sent successfully", slog.String("message_id", newMessage.ID))
	return newMessage.ID, nil
}

// GetMessages возвращает слайс со всей информацией о сообщениях (конвертированных в прото) в конкретном чате с пагинацией
func (m *Message) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*msgv1chat.Message, error) {
	const op = "services.chat.GetMessages"

	log := m.log.With(slog.String("op", op))
	log.Info("getting messages from channel")

	log.Debug("getting user_id from context")
	userID, err := utils.GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	if err := m.channelValidation(ctx, log, channelID, userID); err != nil {
		log.Error("failed channel validation", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}

	log.Debug("getting messages from channel")
	messages, err := m.messageProvider.GetMessages(ctx, channelID, limit, offset)
	if err != nil {
		log.Error("failed to get messages from channel", logger.Err(err))
		return nil, fmt.Errorf("%s: %w", op, err)
	}
	protoMessages := mapper.ConvertMessagesToProto(messages)

	log.Info("messages got successfully")
	return protoMessages, nil
}

// channelValidation проверяет, существует ли канал с таким id, существует ли чат с таким каналом и существует ли пользователь в таком чате
func (m *Message) channelValidation(ctx context.Context, log *slog.Logger, channelID string, userID string) error {
	// проверка, существует ли канал
	log.Debug("checking if channel exists")
	existingChannel, err := m.channelProvider.FindChannelByID(ctx, channelID)
	if err != nil {
		if errors.Is(err, domain.ErrChannelNotFound) {
			log.Error("channel not found", logger.Err(domain.ErrChannelNotFound))
			return domain.ErrChannelNotFound
		}
		log.Error("failed to get channel by id", logger.Err(err))
		return err
	}

	log.Debug("checking if chat exists")
	existingChat, err := m.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrChatNotFound) {
			log.Error("chat not found", logger.Err(domain.ErrChatNotFound))
			return domain.ErrChatNotFound
		}
		log.Error("failed to get chat by id", logger.Err(err))
		return err
	}

	// проверка, есть ли пользователь в чате
	log.Debug("checking if user in this chat")
	if !utils.Contains(existingChat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(domain.ErrAccessDenied))
		return domain.ErrAccessDenied
	}

	return nil
}
