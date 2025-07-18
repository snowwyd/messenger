import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/api/chatService.js';
import { categoryActions } from '@/store/store.js';

import Messages from './MessageList/MessageList.jsx';
import MessageField from './MessageField/MessageField.jsx';
import ChannelList from './ChannelList/ChannelList.jsx';
import CreateChannel from './CreateChannel/CreateChannel.jsx';
import GroupInfo from './GroupInfo/GroupInfo.jsx';

import Resizer from '@/shared/components/Resizer/Resizer.jsx';

import styles from './Chat.module.css';

export default function Chat({ chatId, channelId }) {
    const token = useSelector((state) => state.auth.token);
    const dispatch = useDispatch();

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: () => chatService.getChatInfo(token, chatId),
        cacheTime: 60 * 60000,
        enabled: !!chatId,
    });

    useEffect(() => {
        if (chatInfo.data && !channelId) {
            dispatch(categoryActions.setCurrentPage([chatId, chatInfo.data.channels[0].channelId]));
        }
    }, [chatInfo]);

    const resizableRef = useRef(null);

    return (
        <div className={styles.chat} key={chatId}>
            <div className={styles.messagesWindowContainer} key={channelId}>
                {channelId && chatInfo.isSuccess && (
                    <>
                        <Messages channelId={channelId} usernames={chatInfo.data.usernames} />
                        <MessageField
                            channelId={channelId}
                            channel={chatInfo.data.channels.find((item) => item.channelId === channelId)}
                        />
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
                <div className={styles.top}>
                    <div className={styles.avatarBlock}></div>
                    <div className={styles.channelListBlock}>
                        {chatId && chatInfo.isSuccess && (
                            <>
                                <ChannelList chatId={chatId} channels={chatInfo.data.channels} />
                                <CreateChannel chatId={chatId} />
                            </>
                        )}
                    </div>
                </div>
                <div className={styles.groupInfoBlock}>
                    {chatId && chatInfo.isSuccess && (
                        <GroupInfo memberIds={chatInfo.data.memberIds} usernames={chatInfo.data.usernames} />
                    )}
                </div>
            </div>
        </div>
    );
}
