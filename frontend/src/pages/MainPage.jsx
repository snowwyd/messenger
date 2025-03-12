import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useParams, NavLink, resolvePath } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';

import { AppContext } from "../AppContext";
import ChatSection from "../components/ChatSection";

import './MainPage.css';

export default function MainPage() {
    const grpc = useContext(AppContext);

    const [usernameInput, setUsernameInput] = useState("");
    const [addedUsername, setAddedUsername] = useState("");
    const [addedUserID, setAddedUserID] = useState("");
    
    const createChatModal = useRef(null);
    
    const openModal = () => createChatModal.current.style.display = "flex";
    const closeModal = () => createChatModal.current.style.display = "none";
    
    const { data: chats } = useQuery({ queryKey: ['chats'], queryFn: getChats });
    const { data: usernames } = useQuery({ queryKey: ['usernames'], queryFn: getUsernames, enabled: !!chats });

    async function getUsernames() {
        const userIds = chats.map(item => item.name);
        const response = await grpc.auth.getUsernames({ userIds: userIds });
        return response.response.usernames;
    }

    async function getChats() {
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const response = await grpc.chat.getUserChats({ type: "private" }, rpcOptions);
        return response.response.chats;
    }

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

    async function createChat() {
        const input = {
            type: "private",
            userIds: [addedUserID]
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            await grpc.chat.createChat(input, rpcOptions);
            closeModal();
            getChats();
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
            <div className="chats-container">
                <div className="chat-list">
                    <div onClick={openModal} className="create-chat-button">create chat</div>
                    {usernames && chats.map((item, index) => <ChatButton chatId={item.chatId} username={usernames[item.name]} key={index} />)}
                </div>
                <div className="chat-section">
                    <ChatSection />
                </div>
            </div>
        </>
    )
}

function ChatButton({ chatId, username }) {
    return (
        <NavLink className="chat-button" draggable="false" to={`/chats/${chatId}`}>
            <div className="avatar-block"></div>
            <p className="chat-name">{username}</p>
        </NavLink>
    )
}