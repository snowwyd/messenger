import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

import { useMessages } from '@/features/chat/hooks/useMessages';
import type { ScrollApi } from '@/shared/types/ScrollApi';
import Scroll from '@/shared/widgets/Scroll/Scroll';
import Message from '@/entities/Message/Message';

import styles from './MessageList.module.css';

interface MessageListProps {
    channelId: string;
    usernames: Record<string, string>;
}

const SCROLL_BOTTOM_THRESHOLD = 100;

export default function MessageList({ channelId, usernames }: MessageListProps) {
    const queryClient = useQueryClient();
    const scrollRef = useRef<ScrollApi>(null);

    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isScrollToBottom, setIsScrollToBottom] = useState(false);

    const { allMessages, loadMoreMessages, isSuccess, lastMessage, pageOffset } = useMessages(channelId);

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

    // useLayoutEffect(() => {
    //     const prevFirstMsgElem = document.querySelector(`[data-id="${firstMessageId}"]`);
    //     const offset = prevFirstMsgElem?.getBoundingClientRect().top ?? 100;
    //     scrollRef.current?.setScrollTop(offset - 50);
    // }, [firstMessageId]);

    useEffect(() => {
        if (isSuccess && scrollRef.current) {
            const scrollPosition: number | undefined = queryClient.getQueryData(['scrollPosition', channelId]);
            if (scrollPosition !== undefined) {
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
        if (scrollRef.current && scrollRef.current.scrollBottom.current < SCROLL_BOTTOM_THRESHOLD) {
            scrollRef.current.scrollToBottom();
        }
    }, [lastMessage]);

    useLayoutEffect(() => {
        if (pageOffset.data === 0 && isScrollToBottom) {
            setIsScrollToBottom(false);
            scrollRef.current?.scrollToBottom();
        }
    }, [pageOffset.data, isScrollToBottom]);

    function scrollToBottom() {
        setIsScrollToBottom(true);
        queryClient.setQueryData(['pageOffset', channelId], 0);
    }

    return (
        <>
            <Scroll className={styles.messagesWindow} ref={scrollRef} onScrollCallback={onScrollCallback}>
                {allMessages.map((message, index) => (
                    <Message
                        prevMessage={allMessages[index - 1]}
                        message={message}
                        usernames={usernames}
                        key={message.messageId}
                    />
                ))}
            </Scroll>
            <button
                className={clsx(styles.scrollToBottomButton, !showScrollButton && styles.hiddenButton)}
                onClick={scrollToBottom}
            >
                <div className={styles.icon}></div>
                {newMessagesCount > 0 && <div className={styles.newMessagesIcon}>{newMessagesCount}</div>}
            </button>
        </>
    );
}
