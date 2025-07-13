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

    const [selectedType, setSelectedType] = useState('text');

    const createChannelMutation = useMutation({
        mutationFn: (channel) => chatService.createChannel(token, channel.chatId, channel.name, channel.type),
        onSuccess: () => {
            setChannelName('');
            setIsOpened(false);
        },
    });

    async function createChannel() {
        const channel = {
            chatId: chatId,
            name: channelName,
            type: selectedType,
        };

        createChannelMutation.mutate(channel);
    }

    return (
        <>
            {isOpened && (
                <div ref={createChannelModal} className={styles.createChannelModal}>
                    <div className={styles.modalName}>Create Channel</div>
                    <div className={styles.inputContainer}>
                        <div className={styles.icon}></div>
                        <input
                            value={channelName}
                            onChange={(event) => setChannelName(event.target.value)}
                            className={styles.channelNameInput}
                            placeholder="Channel Name"
                        />
                    </div>
                    <div className={styles.radioButtons}>
                        <label
                            className={`${styles.radioButton} ${selectedType === 'text' && styles.activeRadioButton}`}
                        >
                            <input
                                type="radio"
                                name="channelType"
                                value="text"
                                checked={selectedType === 'text'}
                                onChange={() => setSelectedType('text')}
                            />
                            <span className={styles.radioMark}></span>
                            Text
                        </label>
                        <label
                            className={`${styles.radioButton} ${selectedType === 'voice' && styles.activeRadioButton}`}
                        >
                            <input
                                type="radio"
                                name="channelType"
                                value="voice"
                                checked={selectedType === 'voice'}
                                onChange={() => setSelectedType('voice')}
                            />
                            <span className={styles.radioMark}></span>
                            Voice
                        </label>
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
