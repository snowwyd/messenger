import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from "react-redux";

import { useStream } from "@/hooks/useStream";
import { chatService } from "@/api/chatService";

import Scroll from "@/components/Scroll/Scroll";

import styles from './Messages.module.css';

export default function MessagesWindow({ channelId, membersUsernames }) {
    const location = useLocation();
    const queryClient = useQueryClient();
    const token = useSelector(state => state.auth.token);
    
    const [text, setText] = useState("");
    const textareaRef = useRef(null);
    
    const messageList = useQuery({
        queryKey: ['messageList', channelId],
        queryFn: () => chatService.getMessages(token, channelId, 100, 1),
        cacheTime: 60 * 60000
    });
    
    const sendMessageMutation = useMutation({
        mutationFn: message => chatService.sendMessage(token, message.channelId, message.text),
        onSuccess: data => setText("")
    });

    const messageStream = useStream({
        streamKey: 'messages',
        streamFn: (channelId, key) => chatService.messageStream(token, key, channelId),
        onResponse: newMessage => {
            queryClient.setQueryData(["messageList", channelId], (oldMessages = []) => {
                return [...oldMessages, newMessage];
            });
        },
        onError: error => console.log(error.message)
    });

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [location.pathname, queryClient]);

    async function sendMessage(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (text.trim().replace(/\n/g, '') === '') return setText("");

            const message = {
                channelId: channelId,
                text: text
            }

            sendMessageMutation.mutate(message);
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