import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { userService } from '@/api/userService';
import { chatService } from '@/api/chatService';
import type { State } from '@/types/State';
import type { CreateChatData } from '@/types/CreateChatData';
import Input from '@/shared/ui/Input/Input';
import Button from '@/shared/ui/Button/Button';
import Modal from '@/shared/ui/Modal/Modal';
import SearchIcon from '@/assets/icons/search.svg';

import styles from './CreateDM.module.css';

interface CreateDMProps {
    closeModal: () => void;
}

export default function CreateDM({ closeModal }: CreateDMProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';

    const [enteredUsername, setEnteredUsername] = useState('');
    const [foundUser, setFoundUser] = useState({ userId: '', username: '' });
    const [errorMessage, setErrorMessage] = useState('');

    const getUserIdsMutation = useMutation({
        mutationFn: (usernames: string[]) => userService.getUserIds(usernames),
        onSuccess: (userIds) => {
            setFoundUser({
                userId: userIds[enteredUsername],
                username: enteredUsername,
            });
            setErrorMessage('');
        },
        onError: (error) => {
            setFoundUser({ userId: '', username: '' });
            setErrorMessage(error.message);
        },
    });

    const createChatMutation = useMutation({
        mutationFn: (chat: CreateChatData) => chatService.createChat(token, chat.type, chat.name, chat.userIds),
        onSuccess: () => {
            closeModal();
        },
    });

    function findUser(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') getUserIdsMutation.mutate([enteredUsername]);
    }

    function createChat() {
        const chat: CreateChatData = {
            type: 'private',
            userIds: [foundUser.userId],
            name: '',
        };

        createChatMutation.mutate(chat);
    }

    return (
        <Modal modalHeader="Create DM" className={styles.createDmModal}>
            <Input
                value={enteredUsername}
                onChange={(event) => setEnteredUsername(event.target.value)}
                placeholder="Username"
                icon={SearchIcon}
                onKeyDown={findUser}
            />
            <div className={styles.foundUser}>
                {foundUser.userId && (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}></div>
                            <div className={styles.username}>{foundUser.username}</div>
                        </div>
                        <Button onClick={createChat} className={styles.messageButton}>
                            Message
                        </Button>
                    </>
                )}
                {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            </div>
        </Modal>
    );
}
