import { usePageStore } from '@/shared/hooks/usePageStore';
import Chat from '@/features/chat/components/Chat';
import GroupChat from '@/features/chat/components/GroupChat';

import styles from './Page.module.css';

export default function Page() {
    const { category, chatId, channelId } = usePageStore();

    if (!chatId || !channelId) {
        return <div className={styles.plug}></div>;
    }

    if (category === 'direct') {
        return <Chat chatId={chatId} channelId={channelId} key={chatId} />;
    }

    if (category === 'groups') {
        return <GroupChat chatId={chatId} channelId={channelId} key={chatId} />;
    }
}
