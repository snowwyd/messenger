package chat

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"msgchat/internal/domain/models"
	"msgchat/internal/lib/logger"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	msgv1chat "github.com/snowwyd/protos/gen/go/messenger/msgchat"
)

type Chat struct {
	log             *slog.Logger
	chatProvider    ChatProvider
	channelProvider ChannelProvider
	messageProvider MessageProvider
	tokenTTL        time.Duration
	appSecret       string
}

// Chat interfaces for data layer
type ChatProvider interface {
	SaveChat(ctx context.Context, chat models.Chat) (chatID string, err error)
	FindChat(ctx context.Context, userIDs []string) (chat *models.Chat, err error)
	FindChatByID(ctx context.Context, chatID string, userID string) (chat models.Chat, err error)
	FindUserChats(ctx context.Context, userID string, chatType string) (chatPreviews []*models.ChatPreview, err error)
}

// Channel interfaces for data layer
type ChannelProvider interface {
	SaveChannel(ctx context.Context, channel models.Channel) (chanID string, err error)
	FindChannelByID(ctx context.Context, channelID string) (channel models.Channel, err error)
}

// Message interfaces for data layer
type MessageProvider interface {
	SaveMessage(ctx context.Context, message models.Message) (messageID string, err error)
	GetMessages(ctx context.Context, channelID string, limit int32, offset int32) (messages []*models.Message, err error)
}

// New - конструктор Chat
func New(log *slog.Logger, chatProvider ChatProvider, channelProvider ChannelProvider, messageProvider MessageProvider, tokenTTL time.Duration, appSecret string) *Chat {
	return &Chat{
		log:             log,
		chatProvider:    chatProvider,
		channelProvider: channelProvider,
		messageProvider: messageProvider,
		tokenTTL:        tokenTTL,
		appSecret:       appSecret,
	}
}

var (
	ErrMsgNotFound     = errors.New("message not found")
	ErrChatNotFound    = errors.New("chat not gound")
	ErrChannelNotFound = errors.New("channel not found")

	ErrChatExists = errors.New("chat already exists")
	ErrSameUser   = errors.New("cannot create chat with same user")

	ErrAccessDenied = errors.New("access denied")

	ErrEmptyGroupName = errors.New("group name is empty")

	ErrInvalidChannelType = errors.New("invalid channel type")
	ErrInvalidChatType    = errors.New("invalid chat type")
	ErrInvalidUserCount   = errors.New("chat type and user_ids count mismatch")
	ErrInvalidMessage     = errors.New("invalid message format")
	ErrInvalidPage        = errors.New("invalid pagination params")
)

// CREATE METHODS
// CreateChat создает личные сообщения между UserID из контекста и ContactID, вбивает структуру Chat в базу, содает в ней канал General и возвращает ID структуры Chat
func (c *Chat) CreateChat(ctx context.Context, chatType string, name string, user_ids []string) (string, error) {
	const op = "chat.CreateChat"

	log := c.log.With(slog.String("op", op))
	log.Info("creating chat")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", err
	}

	if !Contains([]string{"group", "private"}, chatType) {
		log.Error("invalid chat type", logger.Err(ErrInvalidChatType))
		return "", ErrInvalidChatType
	}

	// Логика для Private Chat
	// проверка на корректность запроса
	if chatType == "private" {
		if len(user_ids) != 1 {
			log.Error("invalid input: private chat must contain only 1 user_id", logger.Err(ErrInvalidUserCount))
			return "", ErrInvalidUserCount
		}
		if user_ids[0] == userID {
			log.Error("invalid input: private chat can be created only with another person", logger.Err(ErrSameUser))
			return "", ErrSameUser
		}
	} else if name == "" {
		log.Error("invalid input: group name must be not empty", logger.Err(ErrEmptyGroupName))
		return "", ErrEmptyGroupName
	}

	user_ids = append(user_ids, userID)
	user_ids = uniqueStrings(user_ids)

	// проврека, существует ли чат с такими пользователями
	existingChat, _ := c.chatProvider.FindChat(ctx, user_ids)
	if existingChat != nil && chatType == "private" {
		log.Warn("chat already exists!", logger.Err(ErrChatExists))
		return "", fmt.Errorf("%s: %w", op, ErrChatExists)
	}

	// создание нового чата
	newChat := models.Chat{
		MemberIDs:  user_ids,
		ChannelIDs: []string{},
		Type:       chatType,
	}

	if chatType == "group" {
		newChat.Name = name
	}

	chatID, err := c.chatProvider.SaveChat(ctx, newChat)
	if err != nil {
		log.Error("failed to save chat", logger.Err(err))
		return "", err
	}

	// Создание канала General в этом чате по умолчанию
	generalCh := models.Channel{
		ChatID:     chatID,
		Name:       "General",
		Type:       "text",
		MessageIDs: []string{},
	}

	_, err = c.channelProvider.SaveChannel(ctx, generalCh)
	if err != nil {
		log.Error("failed to save chat", logger.Err(err))
		return "", err
	}
	return chatID, nil
}

// CreateChannel проверяет, есть ли пользователь в текущем чате и, если он есть в чате, то создает новый канал по входным параметрам и отправляет сообщение о создании чата. Канал сохраняется в базу, а его айди обновляется в соотв. чате
func (c *Chat) CreateChannel(ctx context.Context, chatID string, name string, chanType string) (string, error) {
	const op = "chat.CreateChannel"

	log := c.log.With(slog.String("op", op))
	log.Info("creating channel")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", err
	}

	// проверка, существует ли чат
	existingChat, _ := c.chatProvider.FindChatByID(ctx, chatID, userID)
	if existingChat.ID == "" {
		log.Error("chat doesn't exist", logger.Err(ErrChatNotFound))
		return "", ErrChatNotFound
	}

	// проверка, есть ли пользователь в чате
	if !Contains(existingChat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(ErrAccessDenied))
		return "", ErrAccessDenied
	}

	// TODO: логика для voice и для text
	if !Contains([]string{"voice", "text"}, chanType) {
		log.Error("invalid channel type", logger.Err(ErrInvalidChannelType))
		return "", ErrInvalidChannelType
	}

	// сохранение чата в БД
	newCh := models.Channel{
		ChatID:     chatID,
		Name:       name,
		Type:       chanType,
		MessageIDs: []string{},
	}

	channelID, err := c.channelProvider.SaveChannel(ctx, newCh)
	if err != nil {
		log.Error("failed to save channel", logger.Err(err))
		return "", err
	}

	// отправка сообщения об успешном создании чата
	createdAt := time.Now()
	startMsg := models.Message{
		ChannelID: channelID,
		Text:      fmt.Sprintf("started channel %s at %s", name, createdAt.Format("02-Jan-2006 15:04:05")),
		SenderID:  userID,
		CreatedAt: createdAt,
	}

	_, err = c.messageProvider.SaveMessage(ctx, startMsg)
	if err != nil {
		log.Error("failed to send message", logger.Err(err))
		return "", err
	}

	return channelID, nil
}

// SendMessage проверяет, есть ли пользователь в чате, где есть ChannelID и затем сохраняет сообщение в базу, а его айди в соотв. канал
func (c *Chat) SendMessage(ctx context.Context, channelID string, text string) (string, error) {
	const op = "chat.SendMessage"

	log := c.log.With(slog.String("op", op))
	log.Info("sending message")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", err
	}

	// проверка, существует ли канал
	existingChannel, _ := c.channelProvider.FindChannelByID(ctx, channelID)
	if existingChannel.ID == "" {
		log.Error("channel doesn't exist", logger.Err(ErrChannelNotFound))
		return "", ErrChannelNotFound
	}

	existingChat, _ := c.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if existingChannel.ID == "" {
		log.Error("chat doesn't exist", logger.Err(ErrChatNotFound))
		return "", ErrChatNotFound
	}

	// проверка, есть ли пользователь в чате
	if !Contains(existingChat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(ErrAccessDenied))
		return "", ErrAccessDenied
	}

	createdAt := time.Now()

	godotenv.Load()
	maxLen, err := strconv.Atoi(os.Getenv("MAX_MESSAGE_LENGTH"))
	if err != nil {
		log.Error("failed to get max message length", logger.Err(err))
		return "", err
	}

	if len(text) > maxLen {
		log.Error("invalid message length", logger.Err(ErrInvalidMessage))
		return "", ErrInvalidMessage
	}

	newMessage := models.Message{
		ChannelID: channelID,
		Text:      text,
		SenderID:  userID,
		CreatedAt: createdAt,
	}

	messageID, err := c.messageProvider.SaveMessage(ctx, newMessage)
	if err != nil {
		log.Error("failed to save message", logger.Err(err))
		return "", err
	}

	return messageID, nil
}

// GETTER METHODS
// GetUserChats возвращает слайс превью чатов конкретного пользователя (user_id из контекста), конвертированных в прото формат
func (c *Chat) GetUserChats(ctx context.Context, chatType string) ([]*msgv1chat.ChatPreview, error) {
	const op = "chat.GetUserChats"

	log := c.log.With(slog.String("op", op))
	log.Info("getting user chats")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return nil, err
	}

	if !Contains([]string{"group", "private"}, chatType) {
		log.Error("invalid chat type", logger.Err(ErrInvalidChatType))
		return nil, ErrInvalidChatType
	}

	chatPreviews, err := c.chatProvider.FindUserChats(ctx, userID, chatType)
	if err != nil {
		log.Error("faild to get chats", logger.Err(err))
		return nil, err
	}

	protoChatPreviews := models.ConvertChatPreviewsToProto(chatPreviews)
	return protoChatPreviews, nil
}

// GetChatInfo возвращает id чата, тип чата, его имя, список участников и всю информацию о каналах (конвертированные в прото формат)
func (c *Chat) GetChatInfo(ctx context.Context, chatID string) (ID string, chatType string, name string, member_ids []string, channels []*msgv1chat.Channel, err error) {
	const op = "chat.GetChatInfo"

	log := c.log.With(slog.String("op", op))
	log.Info("getting user chats")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return "", "", "", nil, nil, err
	}

	chat, err := c.chatProvider.FindChatByID(ctx, chatID, userID)
	if err != nil {
		log.Error("failed to get chat by id", logger.Err(err))
		return "", "", "", nil, nil, err
	}

	if !Contains(chat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(ErrAccessDenied))
		return "", "", "", nil, nil, ErrAccessDenied
	}

	protoChannels := make([]*msgv1chat.Channel, len(chat.ChannelIDs))

	for i, id := range chat.ChannelIDs {
		channel, err := c.channelProvider.FindChannelByID(ctx, id)
		if err != nil {
			log.Error("failed to get chat by id", logger.Err(err))
			return "", "", "", nil, nil, err
		}
		protoChannel := models.ConvertChannelToProto(channel)
		protoChannels[i] = protoChannel
	}
	return chat.ID, chat.Type, chat.Name, chat.MemberIDs, protoChannels, nil
}

// GetMessages возвращает слайс со всей информацией о сообщениях (конвертированных в прото) в конкретном чате с пагинацией
func (c *Chat) GetMessages(ctx context.Context, channelID string, limit int32, offset int32) ([]*msgv1chat.Message, error) {
	const op = "chat.GetMessages"

	log := c.log.With(slog.String("op", op))
	log.Info("getting messages from channel")

	// user_id из контекста
	log.Info("getting user_id from context")
	userID, err := GetUserIDFromContext(ctx)
	if err != nil {
		log.Error("failed to get user_id from context", logger.Err(err))
		return nil, err
	}

	if limit <= 0 || offset <= 0 {
		log.Error("invalid pagination params", logger.Err(ErrInvalidPage))
		return nil, ErrInvalidPage
	}

	// проверка, существует ли канал
	existingChannel, _ := c.channelProvider.FindChannelByID(ctx, channelID)
	if existingChannel.ID == "" {
		log.Error("channel doesn't exist", logger.Err(ErrChannelNotFound))
		return nil, ErrChannelNotFound
	}

	existingChat, _ := c.chatProvider.FindChatByID(ctx, existingChannel.ChatID, userID)
	if existingChannel.ID == "" {
		log.Error("chat doesn't exist", logger.Err(ErrChatNotFound))
		return nil, ErrChatNotFound
	}

	// проверка, есть ли пользователь в чате
	if !Contains(existingChat.MemberIDs, userID) {
		log.Error("user is not in this chat", logger.Err(ErrAccessDenied))
		return nil, ErrAccessDenied
	}

	messages, err := c.messageProvider.GetMessages(ctx, channelID, limit, offset)
	if err != nil {
		log.Error("failed to get messages from channel", logger.Err(err))
		return nil, err
	}

	protoMessages := models.ConvertMessagesToProto(messages)
	return protoMessages, nil
}

/*DeleteMessage удаляет сообщение по ID
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
}*/

func GetUserIDFromContext(ctx context.Context) (string, error) {
	userID, ok := ctx.Value("user_id").(string)
	if !ok || userID == "" {
		return "", errors.New("user_id не найден в контексте")
	}
	return userID, nil
}

// вспомогательные функции
func Contains(slice []string, value string) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}

func uniqueStrings(input []string) []string {
	uniqueMap := make(map[string]struct{})
	var result []string

	for _, str := range input {
		if _, exists := uniqueMap[str]; !exists {
			uniqueMap[str] = struct{}{}
			result = append(result, str)
		}
	}

	return result
}
