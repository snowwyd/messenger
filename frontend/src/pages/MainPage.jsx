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

    if (isError) {
        console.log(error);
        if (error.message === "invalid token signature") localStorage.removeItem('token');
    }

    useEffect(() => {
        if (type == "private") categoryState.setCurrentCategory("chats");
        else if (type == "group") categoryState.setCurrentCategory("groups");
    });

    async function getChats() {
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
        <div className="container">
            <div className="left-panel">
                <Search />
                <Categories />
                {!isLoading && !isError && <ChatList chats={chats} />}
            </div>
            <Chat />
        </div>
    )
}