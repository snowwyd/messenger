import { memo, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { useStream } from '@/hooks/useStream';
import { chatService } from '@/api/chatService';

import Scroll from '@/components/Scroll/Scroll';
import EmojiBlock from './EmojiBlock';

import styles from './Messages.module.css';

export default function MessagesWindow({ channelId, membersUsernames }) {
    return (
        <>
            <MessageList channelId={channelId} membersUsernames={membersUsernames} />
            <Textarea channelId={channelId} />
        </>
    );
}

function MessageList({ channelId, membersUsernames }) {
    const location = useLocation();
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.auth.token);

    const isMessagesLoading = useRef(false);
    const isAllMessagesLoaded = useRef(false);

    const [messages, setMessages] = useState([]);

    const messageList = useQuery({
        queryKey: ['messageList', channelId],
        queryFn: () => chatService.getMessages(token, channelId, 100, 1),
        cacheTime: 30 * 60 * 1000,
    });

    const messageListMutation = useMutation({
        mutationFn: (data) => chatService.getMessages(token, channelId, data.count, data.offset),
        onSuccess: (prevMessages) => {
            if (prevMessages.length === 0) {
                isAllMessagesLoaded.current = true;
            } else {
                setMessages((prev) => {
                    if (prev.at(-1).messageId === prevMessages.at(-1).messageId) return prev;
                    return [...prev, ...prevMessages];
                });
            }

            isMessagesLoading.current = false;
        },
    });

    const messageStream = useStream({
        streamKey: 'messages',
        streamFn: (channelId, key) => chatService.messageStream(token, key, channelId),
        onResponse: (newMessage) => {
            queryClient.setQueryData(['messageList', channelId], (oldMessages = []) => {
                return [newMessage, ...oldMessages];
            });
        },
        onError: (error) => console.log(error.message),
    });

    useEffect(() => {
        setMessages([]);
        isMessagesLoading.current = false;
        isAllMessagesLoaded.current = false;
    }, [location.pathname]);

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [location.pathname, queryClient]);

    useEffect(() => {
        if (!messageList.data) return;
        if (messageList.data.length < 100) isAllMessagesLoaded.current = true;
        setMessages((prev) => {
            if (prev.length === 0) return messageList.data;
            const index = messageList.data.findIndex((message) => message.messageId === prev[0].messageId);
            return [...messageList.data.slice(0, index), ...prev];
        });
    }, [messageList.data]);

    function loadMoreMessages() {
        const data = {
            count: 100,
            offset: messages.length + 1,
        };
        messageListMutation.mutate(data);
    }

    function updateThumbPositionCallback(contentScrollTop) {
        if (isMessagesLoading.current || isAllMessagesLoaded.current) return;

        if (contentScrollTop <= 1000) {
            isMessagesLoading.current = true;
            loadMoreMessages();
        }
    }

    if (messageList.isLoading) return <div>Загрузка</div>;
    if (messageList.error) return <div>Ошибка: {messageList.error.message}</div>;

    return (
        <>
            {messages.length > 0 && (
                <Scroll
                    wrapperClass={styles.messagesWindow}
                    isReversedRender={true}
                    callback={updateThumbPositionCallback}
                >
                    {messages.map((item, index) => (
                        <Message
                            nextMessage={messages[index + 1]}
                            message={item}
                            membersUsernames={membersUsernames}
                            lastMessage={messages.at(-1)}
                            key={item.messageId}
                        />
                    ))}
                </Scroll>
            )}
        </>
    );
}

function Textarea({ channelId }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);
    const token = useSelector((state) => state.auth.token);

    const sendMessageMutation = useMutation({
        mutationFn: (message) => chatService.sendMessage(token, message.channelId, message.text),
        onSuccess: () => setText(''),
    });

    async function sendMessage(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (text.trim().replace(/\n/g, '') === '') return setText('');

            const message = {
                channelId: channelId,
                text: text,
            };

            sendMessageMutation.mutate(message);
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '50px';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    function showHideEmojiBlock() {
        if (isEmojiBlock) {
            setIsEmojiBlock(false);
        } else {
            setIsEmojiBlock(true);
        }
    }

    return (
        <>
            <div className={styles.messageFieldContainer}>
                <div className={styles.messageField}>
                    <textarea
                        ref={textareaRef}
                        onKeyDown={sendMessage}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="write a message..."
                    />
                    <div className={styles.emojiButton} onClick={showHideEmojiBlock}>
                        🤔
                    </div>
                </div>
            </div>
            {isEmojiBlock && <EmojiBlock setText={setText} />}
        </>
    );
}

const Message = memo(function Message({ nextMessage, message, membersUsernames, lastMessage }) {
    const isLastMessage = message.messageId === lastMessage.messageId ? true : false;
    const isFirstInGroup = isLastMessage || nextMessage.senderId !== message.senderId;

    const date = new Date(Number(message.createdAt.seconds) * 1000);
    const formattedDate = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const dateLabel = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const time = date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const nextDate = !isLastMessage ? new Date(Number(nextMessage.createdAt.seconds) * 1000) : date;
    const isAnotherDay = date.toLocaleDateString() !== nextDate.toLocaleDateString() || isLastMessage ? true : false;

    return (
        <>
            <div className={styles.message}>
                {isFirstInGroup || isAnotherDay ? (
                    <div className={styles.messageUserInfo}>
                        <div className={styles.avatar}></div>
                        <div className={styles.usernameMessage}>
                            <span className={styles.username}>
                                {membersUsernames[message.senderId]}
                                <span className={styles.dateCaption}>{formattedDate}</span>
                            </span>
                            <pre className={styles.messageText}>{message.text}</pre>
                        </div>
                    </div>
                ) : (
                    <pre className={styles.messageText}>
                        <span className={styles.timeCaption}>{time}</span>
                        {message.text}
                    </pre>
                )}
            </div>
            {isAnotherDay && (
                <div className={styles.dateLabel}>
                    <span>{dateLabel}</span>
                </div>
            )}
        </>
    );
});
