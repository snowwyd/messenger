import { useContext, useEffect } from "react";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from '@tanstack/react-query';
import { useGrpc } from "@/GrpcContext.jsx";

import ChatList from "@/components/ChatList/ChatList";
import Categories from "@/components/Categories/Categories";
import Search from "@/components/Search/Search";

import styles from './MainLayout.module.css';

export default function MainLayout() {
    const dispatch = useDispatch();
    const categoryState = useSelector((state) => state.category.currentCategory);

    const grpc = useGrpc();
    
    const chatList = useQuery({
        queryKey: ['chatList', categoryState],
        queryFn: getChatList,
        enabled: !!categoryState,
        cacheTime: 60 * 60000
    });

    useEffect(() => {
        if (chatList.isError) {
            console.log(chatList.error.message);
            if (chatList.error.message === "invalid token signature") dispatch({ type: 'deauthorize' });
        }
    }, [chatList.isError, chatList.error]);

    function getChatList() {
        if (categoryState === 'direct') {
            const response = getChats('private');
            return response;
        } else if (categoryState === 'groups') {
            const response = getChats('group');
            return response;
        }

        return null;
    }

    async function getChats(type) {
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const { response } = await grpc.chat.getUserChats({ type: type }, rpcOptions);
        const chats = response.chats;

        if (type === "private") {
            const usernames = await getUsernames(chats);
            for (let i = 0; i < chats.length; i++) chats[i].name = usernames[chats[i].name];
        }

        return chats;
    }

    async function getUsernames(chats) {
        const userIds = chats.map(item => item.name);
        const { response } = await grpc.auth.getUsernames({ userIds: userIds });
        return response.usernames;
    }

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <Search />
                <Categories />
                {chatList.data && !chatList.isLoading && !chatList.isError && <ChatList chats={chatList.data} />}
            </div>
            <Outlet />
        </div>
    )
}