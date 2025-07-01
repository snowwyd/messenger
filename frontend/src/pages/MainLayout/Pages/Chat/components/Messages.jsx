import { memo, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import Linkify from 'linkify-react';
import * as linkify from 'linkifyjs';

import { useStream } from '@/hooks/useStream';
import { chatService } from '@/api/chatService';

import Scroll from '@/components/Scroll/Scroll';
import Embed from '@/components/Embed/Embed';

import styles from './Messages.module.css';

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

export default function MessageList({ channelId, usernames }) {
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
    const embedsRef = useRef(null);

    const options = {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    const links = linkify.find(text);
    const trimmedText = text.trim();
    const isSingleImageLink =
        links.length === 1 && trimmedText === links[0].href && /\.(gif|jpe?g|png|webp)$/i.test(links[0].href.trim());

    return (
        <div className={styles.messageContent}>
            <div className={styles.messageText}>
                {!isSingleImageLink && <Linkify options={options}>{text}</Linkify>}
            </div>
            <div className={styles.embeds} ref={embedsRef}>
                {links.length > 0 &&
                    links.map((item, index) => (
                        <Embed url={item.href} isSingleImageLink={isSingleImageLink} index={index} key={index}></Embed>
                    ))}
            </div>
        </div>
    );
}
