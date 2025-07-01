import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { userService } from '@/api/userService';
import { chatService } from '@/api/chatService';

import styles from './CreateChat.module.css';

export default function CreateChat({ type }) {
    const createChatModal = useRef(null);
    const token = useSelector((state) => state.auth.token);

    const [usernameInput, setUsernameInput] = useState('');
    const [foundUser, setFoundUser] = useState({});
    const [addedUsers, setAddedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');

    const openModal = () => (createChatModal.current.style.display = 'flex');
    const closeModal = () => (createChatModal.current.style.display = 'none');

    const getUserIdsMutation = useMutation({
        mutationFn: (usernames) => userService.getUserIds(usernames),
        onSuccess: (userIds) => {
            setFoundUser({
                userId: userIds[usernameInput],
                username: usernameInput,
            });
        },
        onError: (error) => console.log(error.message),
    });

    const createChatMutation = useMutation({
        mutationFn: (chat) => chatService.createChat(token, chat.type, chat.userIds, chat.name),
        onSuccess: () => closeModal(),
        onError: (error) => console.log(error.message),
    });

    function findUser(event) {
        if (event.key === 'Enter') getUserIdsMutation.mutate([usernameInput]);
    }

    function createChat(userIds) {
        const chat = {
            type: type,
            userIds: userIds,
            name: groupName,
        };

        createChatMutation.mutate(chat);
    }

    function addUser() {
        const isAdded = addedUsers.some((item) => item.userId === foundUser.userId);
        if (isAdded) return;
        setAddedUsers((prev) => [...prev, foundUser]);
    }

    function removeAddedUser(userId) {
        setAddedUsers((prev) => prev.filter((item) => item.userId !== userId));
    }

    return (
        <>
            <div ref={createChatModal} className={styles.createChatModal}>
                <div className={styles.modalContent}>
                    <input
                        className={styles.searchUserInput}
                        onKeyDown={findUser}
                        value={usernameInput}
                        onChange={(event) => setUsernameInput(event.target.value)}
                        placeholder="find a user"
                        type="text"
                    />
                    {foundUser.userId ? (
                        <>
                            <div className={styles.userItem}>
                                <div className={styles.avatarBlock}></div>
                                <p>{foundUser.username}</p>
                                {type === 'private' && (
                                    <div
                                        className={styles.createChat}
                                        onClick={() => createChat([foundUser.userId])}
                                    ></div>
                                )}
                                {type === 'group' && <div className={styles.addUser} onClick={addUser}></div>}
                            </div>
                        </>
                    ) : (
                        <div className={styles.userNotFound}>user not found</div>
                    )}
                    {type === 'group' && (
                        <>
                            <div>group info:</div>
                            <input
                                value={groupName}
                                onChange={(event) => setGroupName(event.target.value)}
                                type="text"
                                placeholder="group name"
                            />
                            <div className={styles.addedUsersList}>
                                {addedUsers.map((item, index) => (
                                    <div key={index} className={styles.addedUser}>
                                        <div className={styles.addedUserUsername}>{item.username}</div>
                                        <div
                                            className={styles.removeAddedUser}
                                            onClick={() => removeAddedUser(item.userId)}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                            <div
                                className={styles.createGroup}
                                onClick={() => createChat(addedUsers.map((user) => user.userId))}
                            >
                                create group
                            </div>
                        </>
                    )}
                    <div onClick={closeModal} className={styles.closeModal}></div>
                </div>
            </div>
            <div onClick={openModal} className={styles.createChatButton}></div>
        </>
    );
}
