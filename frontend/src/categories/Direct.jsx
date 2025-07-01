import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { categoryActions } from '@/store/store.js';

import { chatService } from '@/api/chatService';

import styles from './List.module.css';
import { useEffect, useState } from 'react';

export default function Direct() {
    const token = useSelector((state) => state.auth.token);

    const chatList = useQuery({
        queryKey: ['direct'],
        queryFn: () => chatService.getUserChats(token, 'private'),
        cacheTime: 60 * 60000,
    });

    if (chatList.isLoading) return <div>Загрузка</div>;
    if (chatList.error) return <div>Ошибка: {chatList.error.message}</div>;

    return (
        <div className={styles.chatList}>
            {chatList.data &&
                chatList.data.map((item, index) => <ChatButton chatId={item.chatId} name={item.name} key={index} />)}
        </div>
    );
}

function ChatButton({ chatId, name }) {
    const dispatch = useDispatch();
    const currentPageURL = useSelector((state) => state.category.currentPageURL);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (currentPageURL && currentPageURL[0] == chatId) setIsActive(true);
        else setIsActive(false);
    }, [currentPageURL]);

    function setChatId() {
        dispatch(categoryActions.direct());
        dispatch(categoryActions.setCurrentPage([chatId]));
    }

    const setChatButtonClasses = () => [styles.chatButton, isActive && styles.activeChat].filter(Boolean).join(' ');

    return (
        <NavLink className={setChatButtonClasses} onClick={setChatId} draggable="false">
            <div className={styles.avatarBlock}></div>
            <p>{name}</p>
        </NavLink>
    );
}
