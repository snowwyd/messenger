import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppContext } from "../../AppContext";
import Scroll from "../Scroll/Scroll";

import './Messages.css';

export default function MessagesWindow({ channelId, membersUsernames }) {
    const { grpc, abortController } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [text, setText] = useState("");
    const textareaRef = useRef(null);

    const queryClient = useQueryClient();
    const { data: messages, isError, error, isLoading } = useQuery({
        queryKey: ['messages', channelId],
        queryFn: getMessages,
        cacheTime: 60 * 60000 //minutes
    });

    if (isError) {
        console.log(error.message);
        if (error.message === "invalid token signature") localStorage.removeItem('token');
    }

    useEffect(() => {
        chatStream();
        return () => abortController.abort("switched channel");
    }, [location.pathname, queryClient]);

    async function chatStream() {
        const rpcOptions = grpc.getStreamingOptions(localStorage.getItem('token'));

        try {
            const call = grpc.chat.chatStream({ channelId: channelId }, rpcOptions);
            for await (const response of call.responses) {
                queryClient.setQueryData(["messages", channelId], (oldMessages = []) => {
                    return [...oldMessages, response.payload.newMessage];
                });
            }
        } catch (error) {
            console.log(error.message);
        }
    }

    async function getMessages() {
        const input = {
            channelId: channelId,
            limit: 100,
            offset: 1
        }
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const { response } = await grpc.chat.getMessages(input, rpcOptions);
        return response.messages.reverse();
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
                setText("");
            } catch (error) {
                console.log(error);
                if (error.message == "invalid token signature") {
                    localStorage.removeItem('token');
                    navigate('/');
                }
            }
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "46px";
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [text]);

    return (
        <>
            {!isLoading && !isError && <Scroll wrapperClass={"messages-window"} isMessages={true}>
                {messages.map((item, index) => <Message messages={messages} item={item} index={index} membersUsernames={membersUsernames} key={index} />)}
            </Scroll>}
            <div className="message-field">
                <textarea ref={textareaRef} onKeyDown={sendMessage} value={text} onChange={(event) => setText(event.target.value)} placeholder="write a message..."></textarea>
            </div>
        </>
    )
}

function Message({ messages, item, index, membersUsernames }) {
    const isFirstInGroup = index === 0 || messages[index - 1].senderId !== item.senderId;

    return (
        <div className="message">
            {isFirstInGroup ? (
                <div className="message-user-info">
                    <div className="avatar"></div>
                    <div className="username-message">
                        <span className="username">{membersUsernames[item.senderId]}</span>
                        <pre className="message-text">{item.text}</pre>
                    </div>
                </div>
            ) : (
                <pre className="message-text">{item.text}</pre>
            )}
        </div>
    )
}