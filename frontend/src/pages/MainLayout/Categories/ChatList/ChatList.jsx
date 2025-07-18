import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { categoryActions } from '@/store/store.js';
import { chatService } from '@/api/chatService';

import Scroll from '@/shared/components/Scroll/Scroll.jsx';

import styles from './ChatList.module.css';

export default function ChatList({ type }) {
    const token = useSelector((state) => state.auth.token);
    const [searchText, setSearchText] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');

    const typeMap = {
        direct: { chatType: 'private', action: categoryActions.direct },
        groups: { chatType: 'group', action: categoryActions.groups },
    };

    const { chatType, action } = typeMap[type] || {};

    const chatList = useQuery({
        queryKey: [type],
        queryFn: () => chatService.getUserChats(token, chatType),
        cacheTime: 60 * 60000,
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
                    <div className={styles.chatSort} onClick={changeSort}>
                        <div className={styles.orderName}>
                            {sortOrder === 'newest' ? 'Recently added' : 'Oldest first'}
                        </div>
                        <div className={styles.orderIcon}></div>
                    </div>
                </div>
                {filteredChats.map((item) => (
                    <ChatButton chatId={item.chatId} name={item.name} key={item.chatId} action={action} />
                ))}
            </Scroll>
        </>
    );
}

function ChatButton({ chatId, name, action }) {
    const dispatch = useDispatch();
    const currentPageURL = useSelector((state) => state.category.currentPageURL);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setIsActive(currentPageURL && currentPageURL[0] === chatId);
    }, [currentPageURL, chatId]);

    function setChatId() {
        dispatch(action());
        dispatch(categoryActions.setCurrentPage([chatId]));
    }

    const setChatButtonClasses = () => [styles.chatButton, isActive && styles.activeChat].filter(Boolean).join(' ');

    return (
        <NavLink className={setChatButtonClasses} onClick={setChatId} draggable="false">
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
        </NavLink>
    );
}
