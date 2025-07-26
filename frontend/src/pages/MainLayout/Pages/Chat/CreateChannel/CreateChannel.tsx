import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import { chatService } from '@/api/chatService';
import type { State } from '@/types/State';
import type { CreateChannelData } from '@/types/CreateChannelData';
import type { ChannelType } from '@/types/ChannelType';
import Button from '@/shared/ui/Button/Button';
import Input from '@/shared/ui/Input/Input';
import Modal from '@/shared/ui/Modal/Modal';
import ChannelNameIcon from '@/assets/icons/tag.svg';

import styles from './CreateChannel.module.css';

interface CreateChannelProps {
    chatId: string;
}

export default function CreateChannel({ chatId }: CreateChannelProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';

    const [channelName, setChannelName] = useState('');
    const [isOpened, setIsOpened] = useState(false);

    const [selectedType, setSelectedType] = useState<ChannelType>('text');

    const createChannelMutation = useMutation({
        mutationFn: (channel: CreateChannelData) =>
            chatService.createChannel(token, channel.chatId, channel.name, channel.type),
        onSuccess: () => {
            setChannelName('');
            setIsOpened(false);
        },
    });

    function createChannel() {
        const channel: CreateChannelData = {
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
                        <label className={clsx(styles.radioButton, selectedType === 'text' && styles.active)}>
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
                        <label className={clsx(styles.radioButton, selectedType === 'voice' && styles.active)}>
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
                        <Button onClick={() => setIsOpened(false)} className={styles.button} type="button">
                            Cancel
                        </Button>
                        <Button onClick={createChannel} className={styles.button} type="button">
                            Create
                        </Button>
                    </div>
                </Modal>
            )}
            <button
                onClick={() => setIsOpened((prev) => !prev)}
                className={styles.createChannelButton}
                type="button"
            ></button>
        </>
    );
}
