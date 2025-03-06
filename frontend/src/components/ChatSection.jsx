import { useEffect, useContext, useState, useRef } from "react";
import { useLocation, useParams } from "react-router-dom"

import { AppContext } from "../AppContext";
import Message from "./Message";

import './ChatSection.css'

export default function ChatSection(params) {
    const grpc = useContext(AppContext);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const textareaRef = useRef(null);
    const location = useLocation();
    const { chatId } = useParams();

    useEffect(() => {
        if (!params.isEmpty) {
            setMessages([]);
            getMessages();
        }
    }, [location.pathname]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "46px";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [text]);

    async function getMessages() {
        const token = localStorage.getItem('token');

        const input = {
            chatId: chatId,
            limit: 10,
            offset: 1
        }

        const rpcOptions = grpc.setAuthorizationHeader(token);

        try {
            const response = await grpc.chat.getMessages(input, rpcOptions);
            setMessages(response.response.messages.reverse());
        } catch (error) {
            console.log(error.message);
        }
    }

    async function handleSubmit() {
        const token = localStorage.getItem('token');
        const user_id = localStorage.getItem('user_id');

        if (text.trim().replace(/\n/g, '') === '') return setText("");

        const input = {
            chatId: chatId,
            senderId: user_id,
            text: text
        }

        const rpcOptions = grpc.setAuthorizationHeader(token);

        try {
            await grpc.chat.sendMessage(input, rpcOptions);
            getMessages();
            setText("");
        } catch (error) {
            console.log(error.message);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    }

    return (
        <>
            <div className="messages-window-container">
                <div className="messages-window">
                    {!params.isEmpty && messages.map((item, index) => <Message messages={messages} item={item} index={index} key={index} />)}
                </div>
                <div className="message-field">
                    {!params.isEmpty && (
                        <form onSubmit={handleSubmit} className="message-form">
                            <textarea ref={textareaRef} onKeyDown={handleKeyDown} value={text} onChange={(event) => setText(event.target.value)} placeholder="write a message..."></textarea>
                        </form>
                    )}
                </div>
            </div>
            <div className="chat-details">
                <div className="members-info"></div>
                <div className="channels-list"></div>
            </div>
        </>
    )
}