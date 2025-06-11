import { memo, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { useStream } from '@/hooks/useStream';
import { chatService } from '@/api/chatService';

import Scroll from '@/components/Scroll/Scroll';
import EmojiBlock from './EmojiBlock';

import styles from './Messages.module.css';

export default function MessagesWindow({ channelId, membersUsernames }) {
    const location = useLocation();
    const queryClient = useQueryClient();
    const token = useSelector((state) => state.auth.token);

    const scrollToBottomTrigger = useRef(false);

    const messageListCopy = useRef([]);

    const messageList = useQuery({
        queryKey: ['messageList', channelId],
        queryFn: () => chatService.getMessages(token, channelId, 100, 1),
        cacheTime: 60 * 60000,
    });

    if (messageList.data) messageListCopy.current = [...messageList.data];

    const messageStream = useStream({
        streamKey: 'messages',
        streamFn: (channelId, key) => chatService.messageStream(token, key, channelId),
        onResponse: (newMessage) => {
            queryClient.setQueryData(['messageList', channelId], (oldMessages = []) => {
                return [...oldMessages, newMessage];
            });
        },
        onError: (error) => console.log(error.message),
    });

    useEffect(() => {
        messageStream.stream(channelId);
        return () => messageStream.abortStream();
    }, [location.pathname, queryClient]);

    return (
        <>
            {!messageList.isLoading && !messageList.isError && (
                <Scroll wrapperClass={styles.messagesWindow} messageTrigger={scrollToBottomTrigger.current}>
                    {messageList.data.map((item, index) => (
                        <Message
                            messages={messageListCopy}
                            message={item}
                            index={index}
                            membersUsernames={membersUsernames}
                            key={item.messageId}
                        />
                    ))}
                </Scroll>
            )}
            <Textarea channelId={channelId} scrollToBottomTrigger={scrollToBottomTrigger} />
        </>
    );
}

function Textarea({ channelId, scrollToBottomTrigger }) {
    const [text, setText] = useState('');
    const textareaRef = useRef(null);
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);
    const token = useSelector((state) => state.auth.token);

    const sendMessageMutation = useMutation({
        mutationFn: (message) => chatService.sendMessage(token, message.channelId, message.text),
        onSuccess: () => {
            scrollToBottomTrigger.current = !scrollToBottomTrigger.current;
            setText('');
        },
    });

    async function sendMessage(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (text.trim().replace(/\n/g, '') === '') return setText('');

            const message = {
                channelId: channelId,
                text: text,
            };

            sendMessageMutation.mutate(message);
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '50px';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    function showHideEmojiBlock() {
        if (isEmojiBlock) {
            setIsEmojiBlock(false);
        } else {
            setIsEmojiBlock(true);
        }
    }

    return (
        <>
            <div className={styles.messageFieldContainer}>
                <div className={styles.messageField}>
                    <textarea
                        ref={textareaRef}
                        onKeyDown={sendMessage}
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        placeholder="write a message..."
                    />
                    <div className={styles.emojiButton} onClick={showHideEmojiBlock}>
                        🤔
                    </div>
                </div>
            </div>
            {isEmojiBlock && <EmojiBlock setText={setText} />}
        </>
    );
}

const Message = memo(function Message({ messages, message, index, membersUsernames }) {
    const isFirstMessage = index === 0 ? true : false;
    const isFirstInGroup = isFirstMessage || messages.current[index - 1].senderId !== message.senderId;

    const date = new Date(Number(message.createdAt.seconds) * 1000);
    const formattedDate = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const dateLabel = date.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const time = date.toLocaleString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    const prevDate = !isFirstMessage ? new Date(Number(messages.current[index - 1].createdAt.seconds) * 1000) : date;
    const isAnotherDay = date.toLocaleDateString() !== prevDate.toLocaleDateString() || isFirstMessage ? true : false;

    return (
        <>
            {isAnotherDay && (
                <div className={styles.dateLabel}>
                    <span>{dateLabel}</span>
                </div>
            )}
            <div className={styles.message}>
                {isFirstInGroup || isAnotherDay ? (
                    <div className={styles.messageUserInfo}>
                        <div className={styles.avatar}></div>
                        <div className={styles.usernameMessage}>
                            <span className={styles.username}>
                                {membersUsernames[message.senderId]}{' '}
                                <span className={styles.dateCaption}>{formattedDate}</span>
                            </span>
                            <pre className={styles.messageText}>{message.text}</pre>
                        </div>
                    </div>
                ) : (
                    <pre className={styles.messageText}>
                        <span className={styles.timeCaption}>{time}</span>
                        {message.text}
                    </pre>
                )}
            </div>
        </>
    );
});
