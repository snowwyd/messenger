import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { chatService } from '@/shared/api/chatService';
import Resizer from '@/shared/widgets/Resizer/Resizer';

import Messages from './MessageList';
import MessageField from '@/features/chat/components/SendMessage';
import ChannelList from '../ui/ChannelList';
import CreateChannel from '@/features/chat/components/CreateChannel';
import GroupMembers from '@/features/chat/ui/GroupMembers';
import ChatFiles from '@/features/chat/ui/ChatFiles';

import styles from './Chat.module.css';

interface GroupChatProps {
    chatId: string;
    channelId?: string;
}

export default function GroupChat({ chatId, channelId }: GroupChatProps) {
    const { token } = useAuthStore();

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: () => chatService.getChatInfo(token!, chatId),
        gcTime: 60 * 60000,
    });

    const resizableRef = useRef(null);

    return (
        <>
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
        </>
    );
}
