import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { chatService } from '@/api/chatService';

import styles from './CreateChannel.module.css';

export default function CreateChannel({ chatId }) {
    const token = useSelector((state) => state.auth.token);

    const createChannelModal = useRef(null);
    const [channelName, setChannelName] = useState('');
    const [isOpened, setIsOpened] = useState(false);

    const createChannelMutation = useMutation({
        mutationFn: (channel) => chatService.createChannel(token, channel.chatId, channel.name, channel.type),
        onSuccess: () => setChannelName(''),
    });

    async function createChannel() {
        const channel = {
            chatId: chatId,
            name: channelName,
            type: 'text',
        };

        createChannelMutation.mutate(channel);
    }

    return (
        <>
            {isOpened && (
                <div ref={createChannelModal} className={styles.createChannelModal}>
                    <h3 className={styles.modalName}>Create Channel</h3>
                    <div className={styles.inputContainer}>
                        <div className={styles.icon}></div>
                        <input
                            value={channelName}
                            onChange={(event) => setChannelName(event.target.value)}
                            className={styles.channelNameInput}
                            placeholder="channel name"
                        />
                    </div>
                    <div className={styles.buttons}>
                        <div onClick={() => setIsOpened(false)} className={styles.button}>
                            Cancel
                        </div>
                        <div onClick={createChannel} className={styles.button}>
                            Create
                        </div>
                    </div>
                </div>
            )}
            <div onClick={() => setIsOpened((prev) => !prev)} className={styles.createChannelButton}></div>
        </>
    );
}
