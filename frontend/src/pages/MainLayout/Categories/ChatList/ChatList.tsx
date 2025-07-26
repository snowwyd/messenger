import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import type { ActionCreatorWithoutPayload } from '@reduxjs/toolkit';
import clsx from 'clsx';

import { categoryActions } from '@/store/store';
import { chatService } from '@/api/chatService';
import type { State } from '@/types/State';
import type { ChatType } from '@/types/ChatType';
import Scroll from '@/shared/components/Scroll/Scroll';

import styles from './ChatList.module.css';

type Categories = 'direct' | 'groups';

interface ChatListProps {
    type: Categories;
}

interface ChatConfig {
    chatType: ChatType;
    action: ActionCreatorWithoutPayload;
}

export default function ChatList({ type }: ChatListProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';
    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('newest');

    const typeMap: Record<Categories, ChatConfig> = {
        direct: { chatType: 'private', action: categoryActions.direct },
        groups: { chatType: 'group', action: categoryActions.groups },
    };

    const { chatType, action } = typeMap[type] || {};

    const chatList = useQuery({
        queryKey: ['chatList', type],
        queryFn: () => chatService.getUserChats(token, chatType),
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
        <>
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
                        <div className={styles.orderName}>
                            {sortOrder === 'newest' ? 'Recently added' : 'Oldest first'}
                        </div>
                        <div className={styles.orderIcon}></div>
                    </button>
                </div>
                {filteredChats.map((item) => (
                    <ChatButton chatId={item.chatId} name={item.name} key={item.chatId} action={action} />
                ))}
            </Scroll>
        </>
    );
}

interface ChatButtonProps {
    chatId: string;
    name: string;
    action: ActionCreatorWithoutPayload;
}

function ChatButton({ chatId, name, action }: ChatButtonProps) {
    const dispatch = useDispatch();
    const currentPageURL = useSelector((state: State) => state.category.currentPageURL);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setIsActive(currentPageURL && currentPageURL[0] === chatId);
    }, [currentPageURL, chatId]);

    function setChatId() {
        dispatch(action());
        dispatch(categoryActions.setCurrentPage([chatId]));
    }

    return (
        <button className={clsx(styles.chatButton, isActive && styles.activeChat)} onClick={setChatId}>
            <div className={styles.avatarBlock}></div>
            <div className={styles.chatInfo}>
                <div className={styles.left}>
                    <div className={styles.chatName}>{name}</div>
                    <div className={styles.lastMessage}>last message</div>
                </div>
                <div className={styles.right}>
                    <div className={styles.lastMessageTime}>00:00</div>
                    <div className={styles.lastMessageChannel}>channel</div>
                </div>
            </div>
        </button>
    );
}
