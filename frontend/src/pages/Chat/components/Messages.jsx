import { memo, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { useStream } from '@/hooks/useStream';
import { chatService } from '@/api/chatService';

import Scroll from '@/components/Scroll/Scroll';
import EmojiBlock from './EmojiBlock';

import styles from './Messages.module.css';

export default function MessagesWindow({ channelId, usernames }) {
    return (
        <>
            <MessageList channelId={channelId} usernames={usernames} />
            <Textarea channelId={channelId} />
        </>
    );
}

const MESSAGES_BATCH_SIZE = 100;
const SCROLLTOP_THRESHOLD = 1500;
const SCROLLBOTTOM_THRESHOLD = 100;

function insertMessageWithOverflow(pages, newMessage) {
    const newPages = [...pages];
    let carry = newMessage;

    for (let i = newPages.length - 1; i >= 0; i--) {
        const page = [...newPages[i], carry];

        if (page.length > MESSAGES_BATCH_SIZE) {
            carry = page.shift();
        } else {
            carry = null;
        }

        newPages[i] = page;
        if (!carry) break;
    }

    return newPages;
}

function MessageList({ channelId, usernames }) {
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.auth.token);

    const newestMessageRef = useRef(null);
    const scrollBottom = useRef(0);

    const [renderedMessagesCount, setRenderedMessagesCount] = useState(MESSAGES_BATCH_SIZE);
    const streamedMessagesCount = useRef(0);

    const messageList = useInfiniteQuery({
        queryKey: ['messageList', channelId],
        queryFn: async ({ pageParam = 1 }) => chatService.getMessages(token, channelId, MESSAGES_BATCH_SIZE, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            return lastPageParam - MESSAGES_BATCH_SIZE;
        },
        getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
            if (firstPage.length < MESSAGES_BATCH_SIZE) {
                return undefined;
            }

            if (streamedMessagesCount.current > 0) {
                const pageParam = firstPageParam + MESSAGES_BATCH_SIZE + streamedMessagesCount.current;
                streamedMessagesCount.current = 0;
                return pageParam;
            }

            return firstPageParam + MESSAGES_BATCH_SIZE;
        },
        cacheTime: 30 * 60 * 1000,
    });

    const messageStream = useStream({
        streamKey: 'messages',
        streamFn: (channelId, key) => chatService.messageStream(token, key, channelId),
        onResponse: (newMessage) => {
            queryClient.setQueryData(['messageList', channelId], (oldData) => {
                return {
                    ...oldData,
                    pages: insertMessageWithOverflow(oldData.pages, newMessage),
                };
            });
            streamedMessagesCount.current += 1;
        },
        onError: (error) => console.log(error.message),
    });

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [channelId, queryClient]);

    useEffect(() => {
        if (scrollBottom.current < SCROLLBOTTOM_THRESHOLD) {
            newestMessageRef.current?.scrollIntoView();
        }
    }, [messageList]);

    function onScrollCallback({ scrollTop, scrollHeight, clientHeight }) {
        updateScrollBottom(scrollTop, scrollHeight, clientHeight);
        loadMoreMessages(scrollTop);
    }

    function updateScrollBottom(scrollTop, scrollHeight, clientHeight) {
        scrollBottom.current = scrollHeight - clientHeight - scrollTop;
    }

    function loadMoreMessages(scrollTop) {
        if (messageList.isFetchingPreviousPage) return;
        if (scrollTop <= SCROLLTOP_THRESHOLD) {
            if (messageList.hasPreviousPage) {
                messageList.fetchPreviousPage();
            }

            const maxCount = messageList.data.pages.length * MESSAGES_BATCH_SIZE;

            if (renderedMessagesCount < maxCount) {
                setRenderedMessagesCount((prev) => Math.min(prev + MESSAGES_BATCH_SIZE, maxCount));
            }
        }
    }

    const allMessages = messageList.data
        ? messageList.data.pages.flatMap((page) => page).slice(-renderedMessagesCount)
        : [];

    if (messageList.isLoading) return <div>Загрузка</div>;
    if (messageList.error) return <div>Ошибка: {messageList.error.message}</div>;

    return (
        <Scroll className={styles.messagesWindow} onScrollCallback={onScrollCallback}>
            {allMessages.map((item, index) => (
                <Message
                    prevMessage={allMessages[index - 1]}
                    message={item}
                    usernames={usernames}
                    key={item.messageId}
                />
            ))}
            <div ref={newestMessageRef}></div>
        </Scroll>
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

    useEffect(() => textareaRef.current?.focus());

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '50px';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

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
                    <div className={styles.emojiButton} onClick={() => setIsEmojiBlock((prev) => !prev)}>
                        🤔
                    </div>
                </div>
            </div>
            {isEmojiBlock && <EmojiBlock setText={setText} inputRef={textareaRef} />}
        </>
    );
}

const Message = memo(function Message({ prevMessage, message, usernames }) {
    const isFirstMessage = prevMessage === undefined ? true : false;
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

    const nextDate = !isFirstMessage ? new Date(Number(prevMessage.createdAt.seconds) * 1000) : date;
    const isAnotherDay = date.toLocaleDateString() !== nextDate.toLocaleDateString() || isFirstMessage ? true : false;

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
                                {usernames[message.senderId]}
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
