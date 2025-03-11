import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { AppContext } from "../AppContext";

import './ChatButton.css';

export default function ChatButton({ chatId, name }) {
    const grpc = useContext(AppContext);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();
    
    useEffect(() => {
        getUsername();
    }, []);

    async function getUsername() {
        const input = {
            userIds: [name]
        }

        try {
            const response = await grpc.auth.getUsernames(input);
            setUsername(response.response.usernames[name]);
        } catch (error) {
            console.dir(error)
        }
    }

    async function getChatInfo() {
        const input = {
            chatId: chatId
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.getChatInfo(input, rpcOptions);
            const channels = response.response.channels
            navigate(`/chats/${chatId}/${channels[0].channelId}`);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <NavLink className="chat-button" draggable="false" onClick={getChatInfo} to={`/chats/${chatId}`}>
            <div className="avatar-block"></div>
            <p className="chat-name">{username}</p>
        </NavLink>
    )
}