import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { userService } from '@/api/userService';
import { chatService } from '@/api/chatService';

import styles from './CreateDM.module.css';

export default function CreateDM({ closeModal }) {
    const token = useSelector((state) => state.auth.token);

    const [enteredUsername, setEnteredUsername] = useState('');
    const [foundUser, setFoundUser] = useState({ userId: '', username: '' });
    const [errorMessage, setErrorMessage] = useState('');

    const getUserIdsMutation = useMutation({
        mutationFn: (usernames) => userService.getUserIds(usernames),
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
        mutationFn: (chat) => chatService.createChat(token, chat.type, chat.userIds, chat.name),
        onSuccess: () => {
            closeModal();
        },
    });

    function findUser(event) {
        if (event.key === 'Enter') getUserIdsMutation.mutate([enteredUsername]);
    }

    function createChat() {
        const chat = {
            type: 'private',
            userIds: [foundUser.userId],
            name: '',
        };

        createChatMutation.mutate(chat);
    }

    return (
        <div className={styles.modal}>
            <div className={styles.modalName}>Create DM</div>
            <div className={styles.inputContainer}>
                <div className={styles.icon}></div>
                <input
                    value={enteredUsername}
                    onChange={(event) => setEnteredUsername(event.target.value)}
                    className={styles.usernameInput}
                    placeholder="Username"
                    onKeyDown={findUser}
                />
            </div>
            <div className={styles.foundUser}>
                {foundUser.userId && (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}></div>
                            <div className={styles.username}>{foundUser.username}</div>
                        </div>
                        <div className={styles.messageButton} onClick={createChat}>
                            Message
                        </div>
                    </>
                )}
                {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            </div>
        </div>
    );
}
