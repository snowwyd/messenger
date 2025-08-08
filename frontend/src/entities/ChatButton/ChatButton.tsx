import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { usePageStore } from '@/shared/hooks/usePageStore';

import styles from './ChatButton.module.css';

interface ChatButtonProps {
    chatId: string;
    channelId: string;
    name: string;
    action: () => void;
}

export default function ChatButton({ chatId, channelId, name, action }: ChatButtonProps) {
    const { setChannelId, setChatId, chatId: currentChatId } = usePageStore();

    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setIsActive(currentChatId === chatId);
    }, [chatId, currentChatId]);

    function setChat() {
        action();
        setChatId(chatId);
        setChannelId(channelId);
    }

    return (
        <button className={clsx(styles.chatButton, isActive && styles.activeChat)} onClick={setChat}>
            <div className={styles.avatarBlock}></div>
            <div className={styles.chatInfo}>
                <div className={styles.left}>
                    <div className={styles.chatName}>{name}</div>
                    <div className={styles.lastMessage}>last message</div>
                </div>
                <div className={styles.right}>
                    <div className={styles.lastMessageTime}>00:00</div>
                    <div className={styles.lastMessageChannel}>channel</div>
                </div>
            </div>
        </button>
    );
}
