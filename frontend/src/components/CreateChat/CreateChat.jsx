import { useRef, useState } from "react";

import './CreateChat.css';

export default function CreateChat(params) {
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
                console.log(error);
            }
        }
    }

    async function createChat(type) {
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
            <div ref={createChatModal} className="create-chat-modal">
                <div className="modal-content">
                    <input onKeyDown={addUser} value={usernameInput} onChange={(event) => setUsernameInput(event.target.value)} className="username-input" placeholder="username" type="text" />
                    {addedUsername}
                    <input onClick={createChat} type="submit" value="create chat" />
                    <div onClick={closeModal} className="close-modal"></div>
                </div>
            </div>
            <div onClick={openModal} className="create-chat-button">create chat</div>
        </>
    )
}