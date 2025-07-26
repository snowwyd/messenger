import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { createStreamHandler } from '@/services/createStreamHandler';
import { chatService } from '@/api/chatService';
import type { Message } from '@/proto/gen/chat';
import type { State } from '@/types/State';

const MESSAGES_BATCH_SIZE = 100;
const LOAD_THRESHOLD = 500;

function insertMessageWithOverflow(pages: Message[][], newMessage: Message) {
    const newPages = [...pages];
    let carry: Message | null = newMessage;

    for (let i = newPages.length - 1; i >= 0; i--) {
        const page: Message[] = [...newPages[i], carry];

        if (page.length > MESSAGES_BATCH_SIZE) {
            carry = page.shift() ?? null;
        } else {
            carry = null;
        }

        newPages[i] = page;
        if (!carry) break;
    }

    return newPages;
}

export function useMessages(channelId: string) {
    const queryClient = useQueryClient();
    const token = useSelector((state: State) => state.auth.token) ?? '';
    const streamedMessagesCount = useRef(0);
    const [lastMessage, setLastMessage] = useState({});

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
        gcTime: 30 * 60 * 1000,
    });

    const messageStream = createStreamHandler({
        streamKey: 'messages',
        streamFn: (channelId: string, key: string) => chatService.messageStream(token, key, channelId),
        onResponse: (newMessage) => {
            queryClient.setQueryData(['messageList', channelId], (oldData: { pages: Message[][] }) => {
                return {
                    ...oldData,
                    pages: insertMessageWithOverflow(oldData.pages, newMessage),
                };
            });
            setLastMessage(newMessage);
            streamedMessagesCount.current += 1;
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
    }, [channelId]);

    function loadMoreMessages(scrollTop: number, scrollBottom: number) {
        if (messageList.isFetchingPreviousPage) return;
        if (scrollTop <= LOAD_THRESHOLD) {
            if (messageList.hasPreviousPage) {
                messageList.fetchPreviousPage();
            }

            if ((messageList.data?.pages.length ?? 0) > 1) {
                queryClient.setQueryData(['pageOffset', channelId], (oldData: number) => {
                    const newOffset = Math.min(oldData + 1, messageList.data?.pages.length ?? 0);
                    return newOffset === oldData ? oldData : newOffset;
                });
            }
        }

        if (scrollBottom <= LOAD_THRESHOLD) {
            queryClient.setQueryData(['pageOffset', channelId], (oldData: number) => {
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
        ? renderedPages?.flatMap((page) => {
              return page;
          })
        : [];

    return { allMessages, loadMoreMessages, isSuccess: messageList.isSuccess, lastMessage };
}
