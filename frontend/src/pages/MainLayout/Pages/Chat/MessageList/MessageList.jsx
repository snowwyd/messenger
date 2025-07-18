import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Linkify from 'linkify-react';
import * as linkify from 'linkifyjs';

import { useStream } from '@/hooks/useStream';
import { chatService } from '@/api/chatService';

import Scroll from '@/shared/components/Scroll/Scroll';
import Embed from '@/shared/components/Embed/Embed';

import styles from './MessageList.module.css';

const MESSAGES_BATCH_SIZE = 100;
const LOAD_THRESHOLD = 500;

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

export default function MessageList({ channelId, usernames }) {
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.auth.token);
    const scrollRef = useRef(null);

    const streamedMessagesCount = useRef(0);

    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);

    const messageList = useInfiniteQuery({
        queryKey: ['messageList', channelId],
        queryFn: async ({ pageParam = 1 }) => chatService.getMessages(token, channelId, MESSAGES_BATCH_SIZE, pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
            return lastPageParam - MESSAGES_BATCH_SIZE;
        },
        getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
            if (firstPage.length < MESSAGES_BATCH_SIZE) return undefined;

            const extra = streamedMessagesCount.current;
            if (extra > 0) streamedMessagesCount.current = 0;

            return firstPageParam + MESSAGES_BATCH_SIZE + extra;
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
            setNewMessagesCount((prev) => prev + 1);
        },
        onError: (error) => console.log(error.message),
    });

    const pageOffset = useQuery({
        queryKey: ['pageOffset', channelId],
        queryFn: () => 0,
        initialData: () => queryClient.getQueryData(['pageOffset', channelId]) ?? 0,
        enabled: false,
    });

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [channelId, queryClient]);

    function onScrollCallback({ scrollTop }) {
        queryClient.setQueryData(['scrollPosition', channelId], { scrollTop: scrollTop });
        setShowScrollToBottomButton((prev) => {
            const shouldShow = scrollRef.current.scrollBottom.current > 500;
            if (!shouldShow) {
                setNewMessagesCount(0);
            }
            return prev !== shouldShow ? shouldShow : prev;
        });
        loadMoreMessages(scrollTop);
    }

    function loadMoreMessages(scrollTop) {
        if (messageList.isFetchingPreviousPage) return;
        if (scrollTop <= LOAD_THRESHOLD) {
            if (messageList.hasPreviousPage) {
                messageList.fetchPreviousPage();
            }

            if (messageList.data.pages.length > 1) {
                queryClient.setQueryData(['pageOffset', channelId], (oldData) => {
                    const newOffset = Math.min(oldData + 1, messageList.data.pages.length);
                    return newOffset === oldData ? oldData : newOffset;
                });
            }
        }

        if (scrollRef.current.scrollBottom.current <= LOAD_THRESHOLD) {
            queryClient.setQueryData(['pageOffset', channelId], (oldData) => {
                const newOffset = Math.max(0, oldData - 1);
                return newOffset === oldData ? oldData : newOffset;
            });
        }
    }

    const renderedPages = messageList.data?.pages.slice(
        Math.max(messageList.data?.pages.length - 2 - pageOffset.data, 0),
        Math.max(messageList.data?.pages.length - pageOffset.data, 2)
    );

    const allMessages = messageList.data
        ? renderedPages.flatMap((page) => {
              return page;
          })
        : [];

    useLayoutEffect(() => {
        if (messageList.isSuccess) {
            const scrollPosition = queryClient.getQueryData(['scrollPosition', channelId]);
            if (scrollPosition) {
                scrollRef.current.setScrollTop(scrollPosition.scrollTop);
            } else {
                scrollRef.current.scrollToBottom();
            }
        }
    }, [messageList.isSuccess]);

    useLayoutEffect(() => {
        if (scrollRef.current.scrollBottom.current === 0) {
            scrollRef.current.scrollToBottom();
        }
    }, [newMessagesCount]);

    function handleScrollToBottom() {
        queryClient.setQueryData(['pageOffset', channelId], 0);
        setTimeout(() => scrollRef.current.scrollToBottom(), 0);
    }

    return (
        <Scroll className={styles.messagesWindow} ref={scrollRef} onScrollCallback={onScrollCallback}>
            {allMessages.map((item, index) => (
                <Message
                    prevMessage={allMessages[index - 1]}
                    message={item}
                    usernames={usernames}
                    key={item.messageId}
                />
            ))}
            <div
                className={`${styles.scrollToBottomButton} ${!showScrollToBottomButton && styles.hiddenButton}`}
                onClick={handleScrollToBottom}
            >
                <div className={styles.icon}></div>
                {newMessagesCount > 0 && <div className={styles.newMessagesIcon}>{newMessagesCount}</div>}
            </div>
        </Scroll>
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
                            <MessageContent text={message.text} />
                        </div>
                    </div>
                ) : (
                    <div className={styles.messageContainer}>
                        <span className={styles.timeCaption}>{time}</span>
                        <MessageContent text={message.text} />
                    </div>
                )}
            </div>
        </>
    );
});

function MessageContent({ text }) {
    const options = {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    const links = linkify.find(text);

    return (
        <div className={styles.messageContent}>
            <div className={styles.messageText}>
                <Linkify options={options}>{text}</Linkify>
            </div>
            <div className={styles.embeds}>
                {links.length > 0 &&
                    links.map((item, index) => <Embed url={item.href} index={index} key={index}></Embed>)}
            </div>
        </div>
    );
}
