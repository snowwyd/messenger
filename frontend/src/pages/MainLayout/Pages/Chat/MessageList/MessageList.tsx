import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Linkify from 'linkify-react';
import * as linkify from 'linkifyjs';
import clsx from 'clsx';

import { useMessages } from '@/hooks/useMessages';
import type { Message as MessageType } from '@/proto/gen/chat';
import type { ScrollApi } from '@/types/ScrollApi';
import Scroll from '@/shared/components/Scroll/Scroll';
import Embed from '@/shared/components/Embed/Embed';

import styles from './MessageList.module.css';

interface MessageListProps {
    channelId: string;
    usernames: Record<string, string>;
}

interface MessageProps {
    prevMessage: MessageType;
    message: MessageType;
    usernames: Record<string, string>;
}

interface MessageContentProps {
    text: string;
}

export default function MessageList({ channelId, usernames }: MessageListProps) {
    const queryClient = useQueryClient();
    const scrollRef = useRef<ScrollApi>(null);

    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const { allMessages, loadMoreMessages, isSuccess, lastMessage } = useMessages(channelId);

    function onScrollCallback({ scrollTop }: HTMLDivElement) {
        queryClient.setQueryData(['scrollPosition', channelId], scrollTop);
        if (!scrollRef.current) return;

        const shouldShow = scrollRef.current.scrollBottom.current > 500;
        if (shouldShow) {
            if (!showScrollButton) setShowScrollButton(true);
        } else {
            if (showScrollButton) setShowScrollButton(false);
            if (newMessagesCount !== 0) setNewMessagesCount(0);
        }
        loadMoreMessages(scrollTop, scrollRef.current.scrollBottom.current);
    }

    useEffect(() => {
        if (isSuccess && scrollRef.current) {
            const scrollPosition: number | undefined = queryClient.getQueryData(['scrollPosition', channelId]);
            if (scrollPosition) {
                scrollRef.current.setScrollTop(scrollPosition);
            } else {
                scrollRef.current.scrollToBottom();
            }
        }
    }, [isSuccess]);

    useLayoutEffect(() => {
        if (showScrollButton) {
            setNewMessagesCount((prev) => prev + 1);
        }
        if (scrollRef.current && scrollRef.current.scrollBottom.current < 100) {
            scrollRef.current.scrollToBottom();
        }
    }, [lastMessage]);

    function scrollToBottom() {
        queryClient.setQueryData(['pageOffset', channelId], 0);
        scrollRef.current?.scrollToBottom();
        setTimeout(() => scrollRef.current?.scrollToBottom(), 0);
    }

    return (
        <Scroll className={styles.messagesWindow} ref={scrollRef} onScrollCallback={onScrollCallback}>
            {allMessages?.map((message, index) => (
                <Message
                    prevMessage={allMessages[index - 1]}
                    message={message}
                    usernames={usernames}
                    key={message.messageId}
                />
            ))}
            <button
                className={clsx(styles.scrollToBottomButton, !showScrollButton && styles.hiddenButton)}
                onClick={scrollToBottom}
            >
                <div className={styles.icon}></div>
                {newMessagesCount > 0 && <div className={styles.newMessagesIcon}>{newMessagesCount}</div>}
            </button>
        </Scroll>
    );
}

const Message = memo(function Message({ prevMessage, message, usernames }: MessageProps) {
    const isFirstMessage = prevMessage === undefined ? true : false;
    const isFirstInGroup = isFirstMessage || prevMessage.senderId !== message.senderId;

    const date = new Date(Number(message.createdAt?.seconds) * 1000);
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

    const nextDate = !isFirstMessage ? new Date(Number(prevMessage.createdAt?.seconds) * 1000) : date;
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

function MessageContent({ text }: MessageContentProps) {
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
