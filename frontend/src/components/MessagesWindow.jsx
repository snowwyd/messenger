import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AppContext } from "../AppContext";
import Message from "./Message";

import './MessagesWindow.css';

export default function MessagesWindow() {
    const { channelId } = useParams();
    const grpc = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const textareaRef = useRef(null);

    useEffect(() => {
        setMessages([]);
        getMessages();
    }, [location.pathname]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "46px";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [text]);

    async function getMessages() {
        const input = {
            channelId: channelId,
            limit: 10,
            offset: 1
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.getMessages(input, rpcOptions);
            setMessages(response.response.messages.reverse());
        } catch (error) {
            console.dir(error);
            if (error.message == "invalid token signature") {
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    }

    async function sendMessage(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();

            const token = localStorage.getItem('token');

            if (text.trim().replace(/\n/g, '') === '') return setText("");

            const input = {
                channelId: channelId,
                text: text
            }

            const rpcOptions = grpc.setAuthorizationHeader(token);

            try {
                await grpc.chat.sendMessage(input, rpcOptions);
                getMessages();
                setText("");
            } catch (error) {
                console.dir(error);
                if (error.message == "invalid token signature") {
                    localStorage.removeItem('token');
                    navigate('/');
                }
            }
        }
    }

    return (
        <>
            <div className="messages-window">
                {messages.map((item, index) => <Message messages={messages} item={item} index={index} key={index} />)}
            </div>
            <div className="message-field">
                <textarea ref={textareaRef} onKeyDown={sendMessage} value={text} onChange={(event) => setText(event.target.value)} placeholder="write a message..."></textarea>
            </div>
        </>
    )
}