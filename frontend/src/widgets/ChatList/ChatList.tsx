import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { usePageStore } from '@/shared/hooks/usePageStore';
import { chatService } from '@/shared/api/chatService';
import type { ChatType } from '@/shared/types/ChatType';
import Scroll from '@/shared/widgets/Scroll/Scroll';
import ChatButton from '@/entities/ChatButton/ChatButton';

import styles from './ChatList.module.css';

type Categories = 'direct' | 'groups';

interface ChatListProps {
    type: Categories;
}

interface ChatConfig {
    chatType: ChatType;
    action: () => void;
}

export default function ChatList({ type }: ChatListProps) {
    const { token } = useAuthStore();
    const { direct, groups } = usePageStore();

    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');

    const typeMap: Record<Categories, ChatConfig> = {
        direct: { chatType: 'private', action: direct },
        groups: { chatType: 'group', action: groups },
    };

    const { chatType, action } = typeMap[type] || {};

    const chatList = useQuery({
        queryKey: ['chatList', type],
        queryFn: () => chatService.getUserChats(token!, chatType),
        gcTime: 60 * 60000,
    });

    function changeSort() {
        setSortOrder((prev) => (prev === 'oldest' ? 'newest' : 'oldest'));
    }

    let filteredChats = chatList.data
        ? [...chatList.data].filter((chat) => chat.name.toLowerCase().includes(searchText.toLowerCase()))
        : [];

    if (sortOrder === 'newest') {
        filteredChats = [...filteredChats].reverse();
    }

    return (
        <Scroll className={styles.chatList}>
            <div className={styles.chatsFilterPanel}>
                <div className={styles.chatSearchContainer}>
                    <div className={styles.searchButton}>
                        <div className={styles.icon}></div>
                    </div>
                    <input
                        className={styles.chatSearch}
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search"
                    ></input>
                </div>
                <button className={styles.chatSort} onClick={changeSort}>
                    <div className={styles.orderName}>{sortOrder === 'newest' ? 'Recently added' : 'Oldest first'}</div>
                    <div className={styles.orderIcon}></div>
                </button>
            </div>
            {filteredChats.map((item) => (
                <ChatButton
                    chatId={item.chatId}
                    channelId={item.defaultChannelId}
                    name={item.name}
                    key={item.chatId}
                    action={action}
                />
            ))}
        </Scroll>
    );
}
