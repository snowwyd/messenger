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
    const scrollToBottomTrigger = useRef(false);

    return (
        <>
            <MessageList
                channelId={channelId}
                membersUsernames={membersUsernames}
                scrollToBottomTrigger={scrollToBottomTrigger}
            />
            <Textarea channelId={channelId} scrollToBottomTrigger={scrollToBottomTrigger} />
        </>
    );
}

function MessageList({ channelId, membersUsernames, scrollToBottomTrigger }) {
    const location = useLocation();
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.auth.token);

    const isMessagesLoadingState = useState(false);
    const [isAllMessagesLoaded, setIsAllMessagesLoaded] = useState(false);

    const messageList = useQuery({
        queryKey: ['messageList', channelId],
        queryFn: () => chatService.getMessages(token, channelId, 100, 1),
        cacheTime: 30 * 60 * 1000,
        staleTime: 5 * 60 * 1000,
    });

    const messageListMutation = useMutation({
        mutationFn: (data) => chatService.getMessages(token, channelId, data.count, data.offset),
        onSuccess: (prevMessages) => {
            queryClient.setQueryData(['messageList', channelId], (oldMessages = []) => {
                if (prevMessages.length === 0) {
                    setIsAllMessagesLoaded(true);
                    return oldMessages;
                }

                return [...prevMessages, ...oldMessages];
            });
            isMessagesLoadingState[1](false);
        },
    });

    const loadMoreMessages = () => {
        if (isAllMessagesLoaded) return;

        const data = {
            count: 100,
            offset: messageList.data.length + 1,
        };
        messageListMutation.mutate(data);
    };

    const messageStream = useStream({
        streamKey: 'messages',
        streamFn: (channelId, key) => chatService.messageStream(token, key, channelId),
        onResponse: (newMessage) => {
            queryClient.setQueryData(['messageList', channelId], (oldMessages = []) => {
                return [...oldMessages, newMessage];
            });
        },
        onError: (error) => console.log(error.message),
    });

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [location.pathname, queryClient]);

    if (messageList.isLoading) return <div>Загрузка</div>;
    if (messageList.error) return <div>Ошибка: {messageList.error.message}</div>;

    return (
        <Scroll
            wrapperClass={styles.messagesWindow}
            messageTrigger={scrollToBottomTrigger.current}
            loadMessages={loadMoreMessages}
            isMessagesLoadingState={isMessagesLoadingState}
        >
            {messageList.data.map((item, index) => (
                <Message
                    prevMessage={messageList.data[index - 1]}
                    message={item}
                    index={index}
                    membersUsernames={membersUsernames}
                    key={item.messageId}
                />
            ))}
        </Scroll>
    );
}

function Textarea({ channelId, scrollToBottomTrigger }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);
    const token = useSelector((state) => state.auth.token);

    const sendMessageMutation = useMutation({
        mutationFn: (message) => chatService.sendMessage(token, message.channelId, message.text),
        onSuccess: () => {
            scrollToBottomTrigger.current = !scrollToBottomTrigger.current;
            setText('');
        },
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

const Message = memo(function Message({ prevMessage, message, index, membersUsernames }) {
    const isFirstMessage = index === 0 ? true : false;
    const isFirstInGroup = isFirstMessage || prevMessage.senderId !== message.senderId;

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

    const prevDate = !isFirstMessage ? new Date(Number(prevMessage.createdAt.seconds) * 1000) : date;
    const isAnotherDay = date.toLocaleDateString() !== prevDate.toLocaleDateString() || isFirstMessage ? true : false;

    return (
        <>
            {isAnotherDay && (
                <div className={styles.dateLabel}>
                    <span>{dateLabel}</span>
                </div>
            )}
            <div className={styles.message}>
                {isFirstInGroup || isAnotherDay ? (
                    <div className={styles.messageUserInfo}>
                        <div className={styles.avatar}></div>
                        <div className={styles.usernameMessage}>
                            <span className={styles.username}>
                                {membersUsernames[message.senderId]}{' '}
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
        </>
    );
});
