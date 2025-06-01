import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/api/chatService';

import Messages from './components/Messages';
import ChannelList from './components/ChannelList';

import styles from './Chat.module.css';

export default function Chat() {
    const { chatId, channelId } = useParams();
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
                {channelId && !chatInfo.isLoading && !chatInfo.isError && (
                    <Messages channelId={channelId} membersUsernames={chatInfo.data.usernames} />
                )}
            </div>
            <div className={styles.chatSidebar}>
                <div className={styles.chatDetailsContainer}></div>
                <div className={styles.channelListContainer}>
                    {chatId && !chatInfo.isLoading && !chatInfo.isError && (
                        <ChannelList chatId={chatId} channels={chatInfo.data.channels} />
                    )}
                </div>
            </div>
        </div>
    );
}
