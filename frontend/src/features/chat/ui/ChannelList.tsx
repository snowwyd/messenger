import type { Channel } from '@/proto/gen/chat';
import type { ChannelType } from '@/shared/types/ChannelType';
import Scroll from '@/shared/widgets/Scroll/Scroll';
import ChannelButton from '@/entities/ChannelButton/ChannelButton';

import styles from './ChannelList.module.css';

interface ChannelListProps {
    chatId: string;
    channels: Channel[];
}

export default function ChannelList({ channels }: ChannelListProps) {
    return (
        <Scroll className={styles.channelList}>
            {channels.map((item) => (
                <ChannelButton
                    channelId={item.channelId}
                    name={item.name}
                    type={item.type as ChannelType}
                    key={item.channelId}
                />
            ))}
        </Scroll>
    );
}
