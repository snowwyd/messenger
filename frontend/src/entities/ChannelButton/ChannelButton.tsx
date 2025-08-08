import { useEffect, useState } from 'react';
import clsx from 'clsx';

import { usePageStore } from '@/shared/hooks/usePageStore';
import type { ChannelType } from '@/shared/types/ChannelType';

import styles from './ChannelButton.module.css';

interface ChannelButtonProps {
    channelId: string;
    name: string;
    type: ChannelType;
}

export default function Channel({ channelId, name, type }: ChannelButtonProps) {
    const { setChannelId, channelId: currentChannelId } = usePageStore();

    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setIsActive(currentChannelId === channelId);
    }, [channelId, currentChannelId]);

    return (
        <button
            className={clsx(styles.channel, isActive && styles.activeChannel)}
            onClick={() => setChannelId(channelId)}
        >
            <div
                className={clsx(styles.channelIcon, type === 'text' && styles.text, type === 'voice' && styles.voice)}
            ></div>
            <div className={styles.channelName}>{name}</div>
        </button>
    );
}
