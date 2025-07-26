import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { chatService } from '@/api/chatService';
import { categoryActions } from '@/store/store';
import type { State } from '@/types/State';
import Resizer from '@/shared/components/Resizer/Resizer';

import Messages from './MessageList/MessageList';
import MessageField from './MessageField/MessageField';
import ChannelList from './ChannelList/ChannelList';
import CreateChannel from './CreateChannel/CreateChannel';
import GroupMembers from './GroupMembers/GroupMembers';
import ChatFiles from './ChatFiles/ChatFiles';

import styles from './Chat.module.css';

interface GroupChatProps {
    chatId: string;
    channelId?: string;
}

export default function GroupChat({ chatId, channelId }: GroupChatProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';
    const dispatch = useDispatch();

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: () => chatService.getChatInfo(token, chatId),
        gcTime: 60 * 60000,
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
                            channelName={
                                chatInfo.data.channels.find((item) => item.channelId === channelId)?.name ?? ''
                            }
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
                <div className={styles.groupMembersBlock}>
                    {chatId && chatInfo.isSuccess && (
                        <GroupMembers memberIds={chatInfo.data.memberIds} usernames={chatInfo.data.usernames} />
                    )}
                </div>
                <div className={styles.chatFilesBlock}>{chatId && chatInfo.isSuccess && <ChatFiles />}</div>
            </div>
        </div>
    );
}
