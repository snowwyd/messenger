import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from '@tanstack/react-query';

import { authActions } from "@/store";
import { chatService } from "@/api/chatService";

import ChatList from "./components/ChatList";
import Categories from "./components/Categories";
import Search from "./components/Search";

import styles from './MainLayout.module.css';

export default function MainLayout() {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const categoryState = useSelector(state => state.category.currentCategory);
    
    const chatList = useQuery({
        queryKey: ['chatList', categoryState],
        queryFn: getChatList,
        enabled: !!categoryState,
        cacheTime: 60 * 60000
    });

    useEffect(() => {
        if (chatList.isError) {
            console.log(chatList.error.message);
            if (chatList.error.message === "invalid token signature") dispatch(authActions.deauthorize());
        }
    }, [chatList.isError, chatList.error]);

    function getChatList() {
        if (categoryState === 'direct') return chatService.getUserChats(token, 'private');
        else if (categoryState === 'groups') return chatService.getUserChats(token, 'group');
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <Search />
                <Categories />
                {chatList.data && <ChatList chats={chatList.data} />}
            </div>
            <Outlet />
        </div>
    )
}