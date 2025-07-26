import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import clsx from 'clsx';

import { categoryActions } from '@/store/store.js';
import type { Channel } from '@/proto/gen/chat';
import type { State } from '@/types/State';
import type { ChannelType } from '@/types/ChannelType';
import Scroll from '@/shared/components/Scroll/Scroll';

import styles from './ChannelList.module.css';

interface ChannelListProps {
    chatId: string;
    channels: Channel[];
}

interface ChannelButtonProps {
    chatId: string;
    channelId: string;
    name: string;
    type: ChannelType;
}

export default function ChannelList({ chatId, channels }: ChannelListProps) {
    return (
        <Scroll className={styles.channelList}>
            {channels.map((item) => (
                <ChannelButton
                    chatId={chatId}
                    channelId={item.channelId}
                    name={item.name}
                    type={item.type as ChannelType}
                    key={item.channelId}
                />
            ))}
        </Scroll>
    );
}

function ChannelButton({ chatId, channelId, name, type }: ChannelButtonProps) {
    const dispatch = useDispatch();
    const currentPageURL = useSelector((state: State) => state.category.currentPageURL);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (currentPageURL && currentPageURL[1] === channelId) setIsActive(true);
        else setIsActive(false);
    }, [currentPageURL, channelId]);

    const setChannelId = () => dispatch(categoryActions.setCurrentPage([chatId, channelId]));

    return (
        <button className={clsx(styles.channel, isActive && styles.activeChannel)} onClick={setChannelId}>
            <div
                className={clsx(styles.channelIcon, type === 'text' && styles.text, type === 'voice' && styles.voice)}
            ></div>
            <div className={styles.channelName}>{name}</div>
        </button>
    );
}
