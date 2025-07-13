import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { categoryActions } from '@/store/store.js';

import Scroll from '@/components/Scroll/Scroll';

import styles from './ChannelList.module.css';

export default function ChannelList({ chatId, channels }) {
    return (
        <Scroll className={styles.channelList}>
            {channels.map((item) => (
                <Channel
                    chatId={chatId}
                    channelId={item.channelId}
                    channelName={item.name}
                    channelType={item.type}
                    key={item.channelId}
                />
            ))}
        </Scroll>
    );
}

function Channel({ chatId, channelId, channelName, channelType }) {
    const dispatch = useDispatch();
    const currentPageURL = useSelector((state) => state.category.currentPageURL);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (currentPageURL && currentPageURL[1] == channelId) setIsActive(true);
        else setIsActive(false);
    }, [currentPageURL]);

    const setChannelId = () => dispatch(categoryActions.setCurrentPage([chatId, channelId]));

    const channelClasses = [styles.channel, isActive && styles.activeChannel].filter(Boolean).join(' ');

    return (
        <div className={channelClasses} onClick={setChannelId}>
            <div
                className={`${styles.channelIcon} 
                ${channelType === 'text' && styles.text}
                ${channelType === 'voice' && styles.voice}`}
            ></div>
            <div className={styles.channelName}>{channelName}</div>
        </div>
    );
}
