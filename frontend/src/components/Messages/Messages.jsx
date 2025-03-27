import { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppContext } from "../../AppContext";
import Scroll from "../Scroll/Scroll";

import styles from './Messages.module.css';

export default function MessagesWindow({ channelId, membersUsernames }) {
    const { grpc, abortController, isAuthorizedState } = useContext(AppContext);
    const location = useLocation();

    const [text, setText] = useState("");
    const textareaRef = useRef(null);

    const queryClient = useQueryClient();
    const messageList = useQuery({
        queryKey: ['messageList', channelId],
        queryFn: getMessages,
        cacheTime: 60 * 60000
    });

    useEffect(() => {
        if (messageList.isError) {
            console.log(messageList.error.message);
            if (messageList.error.message === "invalid token signature") isAuthorizedState.setIsAuthorized(false);
        }
    }, [messageList.isError, messageList.error]);

    useEffect(() => {
        chatStream();
        return () => abortController.abort();
    }, [location.pathname, queryClient]);

    async function chatStream() {
        const rpcOptions = grpc.getStreamingOptions(localStorage.getItem('token'));

        try {
            const call = grpc.chat.chatStream({ channelId: channelId }, rpcOptions);
            for await (const response of call.responses) {
                queryClient.setQueryData(["messageList", channelId], (oldMessages = []) => {
                    return [...oldMessages, response.payload.newMessage];
                });
            }
        } catch (error) {
            console.log(error.message);
            if (error.message === "invalid token signature") {
                isAuthorizedState.setIsAuthorized(false);
            } else if (error.message === "stream timeout") {
                chatStream();
            }
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

            if (text.trim().replace(/\n/g, '') === '') return setText("");

            const input = {
                channelId: channelId,
                text: text
            }

            const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

            try {
                await grpc.chat.sendMessage(input, rpcOptions);
                setText("");
            } catch (error) {
                console.log(error.message);
                if (error.message == "invalid token signature") {
                    isAuthorizedState.setIsAuthorized(false);
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
            {!messageList.isLoading && !messageList.isError && <Scroll wrapperClass={styles.messagesWindow} isMessages={true}>
                {messageList.data.map((item, index) => <Message messages={messageList.data} message={item} index={index} membersUsernames={membersUsernames} key={index} />)}
            </Scroll>}
            <div className={styles.messageField}>
                <textarea ref={textareaRef} onKeyDown={sendMessage} value={text} onChange={(event) => setText(event.target.value)} placeholder="write a message..."></textarea>
            </div>
        </>
    )
}

function Message({ messages, message, index, membersUsernames }) {
    const isFirstMessage = index === 0 ? true : false;
    const isFirstInGroup = isFirstMessage || messages[index - 1].senderId !== message.senderId;

    const date = new Date(Number(message.createdAt.seconds) * 1000);
    const formattedDate = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const dateLabel = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const time = date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const prevDate = !isFirstMessage ? new Date(Number(messages[index - 1].createdAt.seconds) * 1000) : date;
    const isAnotherDay = date.toLocaleDateString() !== prevDate.toLocaleDateString() || isFirstMessage ? true : false;
    
    return (
        <>
            {isAnotherDay && (
                <div className={styles.dateLabel}><span>{dateLabel}</span></div>
            )}
            <div className={styles.message}>
                {isFirstInGroup || isAnotherDay ? (
                    <div className={styles.messageUserInfo}>
                        <div className={styles.avatar}></div>
                        <div className={styles.usernameMessage}>
                            <span className={styles.username}>{membersUsernames[message.senderId]} <span className={styles.dateCaption}>{formattedDate}</span></span>
                            <pre className={styles.messageText}>{message.text}</pre>
                        </div>
                    </div>
                ) : (
                    <pre className={styles.messageText}><span className={styles.timeCaption}>{time}</span>{message.text}</pre>
                )}
            </div>
        </>
    )
}