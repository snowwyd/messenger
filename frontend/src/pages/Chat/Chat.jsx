import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/api/chatService';

import Messages from './components/Messages';
import ChannelList from './components/ChannelList';

import styles from './Chat.module.css';

export default function Chat({ chatId, channelId }) {
    const token = useSelector((state) => state.auth.token);

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: () => chatService.getChatInfo(token, chatId),
        cacheTime: 60 * 60000,
        enabled: !!chatId,
    });

    return (
        <div className={styles.chat}>
            <div className={styles.messagesWindowContainer}>
                {channelId && chatInfo.isSuccess && (
                    <Messages channelId={channelId} usernames={chatInfo.data.usernames} key={channelId} />
                )}
            </div>
            <div className={styles.chatSidebar}>
                <div className={styles.avatarBlock}></div>
                <div className={styles.channelListContainer}>
                    {chatId && chatInfo.isSuccess && <ChannelList chatId={chatId} channels={chatInfo.data.channels} />}
                </div>
            </div>
        </div>
    );
}
