import { useRef } from 'react';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/api/chatService.js';

import Messages from './components/Messages.jsx';
import MessageField from './components/MessageField.jsx';
import ChannelList from './components/ChannelList.jsx';
import CreateChannel from './components/CreateChannel.jsx';

import Resizer from '@/components/Resizer/Resizer.jsx';

import styles from './Chat.module.css';

export default function Chat({ chatId, channelId }) {
    const token = useSelector((state) => state.auth.token);

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: () => chatService.getChatInfo(token, chatId),
        cacheTime: 60 * 60000,
        enabled: !!chatId,
    });

    const resizableRef = useRef(null);

    return (
        <div className={styles.chat} key={chatId}>
            <div className={styles.messagesWindowContainer} key={channelId}>
                {channelId && chatInfo.isSuccess && (
                    <>
                        <Messages channelId={channelId} usernames={chatInfo.data.usernames} />
                        <MessageField channelId={channelId} />
                    </>
                )}
            </div>
            <div className={styles.chatSidebar} ref={resizableRef}>
                <Resizer
                    className={styles.sidebarResizer}
                    resizableRef={resizableRef}
                    clamp={[200, 400]}
                    isLeftSide={true}
                />
                <div className={styles.avatarBlock}></div>
                <div className={styles.channelListContainer}>
                    {chatId && chatInfo.isSuccess && (
                        <>
                            <ChannelList chatId={chatId} channels={chatInfo.data.channels} />
                            <CreateChannel chatId={chatId} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
