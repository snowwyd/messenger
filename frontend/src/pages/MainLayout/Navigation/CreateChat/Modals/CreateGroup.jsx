import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { userService } from '@/api/userService';
import { chatService } from '@/api/chatService';

import styles from './CreateGroup.module.css';

export default function CreateGroup({ closeModal }) {
    const token = useSelector((state) => state.auth.token);

    const [enteredUsername, setEnteredUsername] = useState('');
    const [foundUser, setFoundUser] = useState({ userId: '', username: '' });
    const [errorMessage, setErrorMessage] = useState('');

    const [addedUsers, setAddedUsers] = useState([]);
    const [enteredGroupName, setEnteredGroupName] = useState('');

    const avatarInputRef = useRef(null);
    const [avatarUrl, setAvatarUrl] = useState('');

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

    function addUser() {
        if (addedUsers.some((user) => user.userId === foundUser.userId)) return;
        setAddedUsers((prev) => [...prev, foundUser]);
    }

    function removeUser(userId) {
        setAddedUsers((prev) => prev.filter((user) => user.userId !== userId));
    }

    function createChat() {
        const chat = {
            type: 'group',
            userIds: addedUsers.map((user) => user.userId),
            name: enteredGroupName || addedUsers.map((user) => user.username).join(', '),
        };

        createChatMutation.mutate(chat);
    }

    function handleFileChange(event) {
        const file = event.target.files[0];
        const url = URL.createObjectURL(file);
        if (url) {
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
        }
    }

    return (
        <div className={styles.modal}>
            <div className={styles.modalName}>Create Group</div>
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
                        <div className={styles.messageButton} onClick={addUser}>
                            Add
                        </div>
                    </>
                )}
                {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            </div>
            <div className={styles.userList}>
                {addedUsers.map((user) => (
                    <div className={styles.addedUser} onClick={() => removeUser(user.userId)} key={user.userId}>
                        <div className={styles.username}>{user.username}</div>
                        <div className={styles.removeUserButton}></div>
                    </div>
                ))}
            </div>
            <div className={styles.groupInfo}>
                <div className={styles.groupAvatarContainer} onClick={() => avatarInputRef.current.click()}>
                    {!avatarUrl && (
                        <div className={styles.groupAvatarBorder}>
                            <div className={styles.groupAvatarImage}>
                                <input
                                    ref={avatarInputRef}
                                    onChange={handleFileChange}
                                    type="file"
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                    )}
                    {avatarUrl && <img src={avatarUrl} />}
                </div>
                <div className={styles.groupName}>
                    <div className={styles.groupNameText}>Group Name</div>
                    <div className={styles.groupNameInputContainer}>
                        <div className={styles.icon}></div>
                        <input
                            value={enteredGroupName}
                            onChange={(event) => setEnteredGroupName(event.target.value)}
                            className={styles.groupNameInput}
                            placeholder={
                                addedUsers.length > 0
                                    ? addedUsers.map((user) => user.username).join(', ')
                                    : 'Group Name'
                            }
                        />
                    </div>
                </div>
            </div>
            <div className={styles.buttons}>
                <div onClick={closeModal} className={styles.button}>
                    Cancel
                </div>
                <div onClick={createChat} className={styles.button}>
                    Create
                </div>
            </div>
        </div>
    );
}
