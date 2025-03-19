import { useContext, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';

import { AppContext } from "../AppContext";
import Chat from "../components/Chat/Chat";
import ChatList from "../components/ChatList/ChatList";
import Categories from "../components/Categories/Categories";
import Search from "../components/Search/Search";

import './MainPage.css';

export default function MainPage({ type }) {
    const { grpc, categoryState } = useContext(AppContext);

    const { data: chats, isError, error, isLoading } = useQuery({ queryKey: ['chats', type], queryFn: getChats });
    const { data: usernames } = useQuery({ queryKey: ['usernames'], queryFn: getUsernames, enabled: !!chats });

    if (isError && error.message === "invalid token signature") localStorage.removeItem('token');

    async function getUsernames() {
        const userIds = chats.map(item => item.name);
        const { response } = await grpc.auth.getUsernames({ userIds: userIds });
        return response.usernames;
    }

    async function getChats() {
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const { response } = await grpc.chat.getUserChats({ type: type }, rpcOptions);
        return response.chats;
    }

    useEffect(() => {
        if (type == "private") categoryState.setCurrentCategory("chats");
        else if (type == "group") categoryState.setCurrentCategory("groups");
    });

    return (
        <div className="container">
            <div className="left-panel">
                <Search />
                <Categories />
                {!isLoading && <ChatList chats={chats} usernames={usernames} />}
            </div>
            <Chat />
        </div>
    )
}