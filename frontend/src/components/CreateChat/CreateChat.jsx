import { useContext, useRef, useState } from "react";
import { useGrpc } from "@/GrpcContext.jsx";

import styles from './CreateChat.module.css';

export default function CreateChat({ type }) {
    const grpc = useGrpc();
    const createChatModal = useRef(null);

    const [usernameInput, setUsernameInput] = useState("");
    const [addedUsername, setAddedUsername] = useState("");
    const [addedUserID, setAddedUserID] = useState("");

    const openModal = () => createChatModal.current.style.display = "flex";
    const closeModal = () => createChatModal.current.style.display = "none";

    async function addUser(event) {
        if (event.key === "Enter") {
            try {
                const response = await grpc.auth.getUserIDs({ usernames: [usernameInput] });
                setAddedUsername(usernameInput);
                setAddedUserID(response.response.userIds[usernameInput]);
            } catch (error) {
                console.log(error.message);
                setAddedUsername("");
                setAddedUserID("");
            }
        }
    }

    async function createChat() {
        const input = {
            type: type,
            userIds: [addedUserID]
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            await grpc.chat.createChat(input, rpcOptions);
            closeModal();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div ref={createChatModal} className={styles.createChatModal}>
                <div className={styles.modalContent}>
                    <input onKeyDown={addUser} value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} placeholder="find a user" type="text" />
                    {addedUsername ? (
                        <div className={styles.userItem}>
                            <div className={styles.avatarBlock}></div>
                            <p>{addedUsername}</p>
                            <div className={styles.createChat} onClick={createChat}></div>
                        </div>
                    ): (
                        <div className={styles.userNotFound}>user not found</div>
                    )}
                    <div onClick={closeModal} className={styles.closeModal}></div>
                </div>
            </div>
            <div onClick={openModal} className={styles.createChatButton}>create chat</div>
        </>
    )
}