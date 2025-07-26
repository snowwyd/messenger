import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';

import { userService } from '@/api/userService';
import { chatService } from '@/api/chatService';
import type { State } from '@/types/State';
import type { CreateChatData } from '@/types/CreateChatData';
import Button from '@/shared/ui/Button/Button';
import Input from '@/shared/ui/Input/Input';
import Modal from '@/shared/ui/Modal/Modal';
import SearchIcon from '@/assets/icons/search.svg';
import GroupNameIcon from '@/assets/icons/tag.svg';

import styles from './CreateGroup.module.css';

interface CreateGroupProps {
    closeModal: () => void;
}

interface FoundUser {
    userId: string;
    username: string;
}

export default function CreateGroup({ closeModal }: CreateGroupProps) {
    const token = useSelector((state: State) => state.auth.token) ?? '';

    const [enteredUsername, setEnteredUsername] = useState('');
    const [foundUser, setFoundUser] = useState<FoundUser>({ userId: '', username: '' });
    const [errorMessage, setErrorMessage] = useState('');

    const [addedUsers, setAddedUsers] = useState<FoundUser[]>([]);
    const [enteredGroupName, setEnteredGroupName] = useState('');

    const avatarInputRef = useRef(null);
    const [avatarUrl, setAvatarUrl] = useState('');

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

    function addUser() {
        if (addedUsers.some((user: FoundUser) => user.userId === foundUser.userId)) return;
        setAddedUsers((prev) => [...prev, foundUser]);
    }

    function removeUser(userId: string) {
        setAddedUsers((prev) => prev.filter((user) => user.userId !== userId));
    }

    function createChat() {
        const chat: CreateChatData = {
            type: 'group',
            userIds: addedUsers.map((user) => user.userId),
            name: enteredGroupName || addedUsers.map((user) => user.username).join(', '),
        };

        createChatMutation.mutate(chat);
    }

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files) return;

        const url = URL.createObjectURL(files[0]);
        if (url) {
            const url = URL.createObjectURL(files[0]);
            setAvatarUrl(url);
        }
    }

    return (
        <Modal modalHeader="Create Group" className={styles.createGroupModal}>
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
                        <Button onClick={addUser} className={styles.addUserButton}>
                            Add
                        </Button>
                    </>
                )}
                {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
            </div>
            <div className={styles.userList}>
                {addedUsers.map((user) => (
                    <button className={styles.addedUser} onClick={() => removeUser(user.userId)} key={user.userId}>
                        <div className={styles.username}>{user.username}</div>
                        <div className={styles.removeUserIcon}></div>
                    </button>
                ))}
            </div>
            <div className={styles.groupInfo}>
                <label className={styles.groupAvatarContainer}>
                    <input ref={avatarInputRef} onChange={handleFileChange} type="file" accept="image/*" hidden />
                    {!avatarUrl && (
                        <div className={styles.groupAvatarBorder}>
                            <div className={styles.groupAvatarAddIcon}></div>
                        </div>
                    )}
                    {avatarUrl && (
                        <div className={styles.groupAvatarImage} style={{ backgroundImage: `url(${avatarUrl})` }}></div>
                    )}
                </label>
                <div className={styles.groupNameSection}>
                    <div className={styles.groupNameText}>Group Name</div>
                    <Input
                        value={enteredGroupName}
                        onChange={(event) => setEnteredGroupName(event.target.value)}
                        placeholder={
                            addedUsers.length > 0 ? addedUsers.map((user) => user.username).join(', ') : 'Group Name'
                        }
                        icon={GroupNameIcon}
                    />
                </div>
            </div>
            <div className={styles.buttons}>
                <Button onClick={closeModal} className={styles.button}>
                    Cancel
                </Button>
                <Button onClick={createChat} className={styles.button}>
                    Create
                </Button>
            </div>
        </Modal>
    );
}
