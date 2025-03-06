import { useContext, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import { AppContext } from "../AppContext";
import ChatButton from "../components/ChatButton";
import ChatSection from "../components/ChatSection";

import './Chats.css';

export default function Chats() {
    const grpc = useContext(AppContext);
    const [chats, setChats] = useState([]);

    useEffect(() => {
        getChats();
    }, []);

    async function getChats() {
        const token = localStorage.getItem('token');
        const user_id = localStorage.getItem('user_id');

        const input = {
            userId: user_id
        }

        const rpcOptions = grpc.setAuthorizationHeader(token);

        try {
            const response = await grpc.chat.getUserChats(input, rpcOptions);
            setChats(response.response.chats);
        } catch (error) {
            console.log(error.message);
        }
    }

    return (
        <div className="chats-container">
            <div className="chats-list">
                {chats.map((item, index) => (
                    <ChatButton chatId={item.chatId} index={index} key={index} />
                ))}
            </div>
            <div className="chat-section">
                <Routes>
                    <Route path="" element={<ChatSection isEmpty={true} />} />
                    <Route path=":chatId" element={<ChatSection />} />
                </Routes>
            </div>
        </div>
    )
}