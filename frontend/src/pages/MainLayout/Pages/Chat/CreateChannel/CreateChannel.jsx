import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { chatService } from '@/api/chatService';

import styles from './CreateChannel.module.css';

import Button from '@/shared/ui/Button/Button';
import Input from '@/shared/ui/Input/Input';
import ChannelNameIcon from '@/assets/icons/tag.svg';
import Modal from '@/shared/ui/Modal/Modal';

export default function CreateChannel({ chatId }) {
    const token = useSelector((state) => state.auth.token);

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
                <Modal modalHeader="Create Channel" className={styles.createChannelModal}>
                    <Input
                        value={channelName}
                        onChange={(event) => setChannelName(event.target.value)}
                        placeholder="Channel Name"
                        icon={ChannelNameIcon}
                    />
                    <div className={styles.radioButtons}>
                        <label className={`${styles.radioButton} ${selectedType === 'text' && styles.active}`}>
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
                        <label className={`${styles.radioButton} ${selectedType === 'voice' && styles.active}`}>
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
                        <Button onClick={() => setIsOpened(false)} placeholder="Cancel" className={styles.button} />
                        <Button onClick={createChannel} placeholder="Create" className={styles.button} />
                    </div>
                </Modal>
            )}
            <div onClick={() => setIsOpened((prev) => !prev)} className={styles.createChannelButton}></div>
        </>
    );
}
