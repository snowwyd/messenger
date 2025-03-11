import { useContext, useEffect, useState, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import { AppContext } from "../AppContext";
import ChatButton from "../components/ChatButton";
import ChatSection from "../components/ChatSection";

import './Chats.css';

export default function Chats() {
    const grpc = useContext(AppContext);
    const navigate = useNavigate();

    const [chats, setChats] = useState([]);
    const [usernameInput, setUsernameInput] = useState("");
    const [addedUsername, setAddedUsername] = useState("");
    const [addedUserID, setAddedUserID] = useState("");

    const createChatModal = useRef(null);

    useEffect(() => {
        getChats();
    }, []);

    async function getChats() {
        const input = {
            type: "private"
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.getUserChats(input, rpcOptions);
            setChats(response.response.chats);
        } catch (error) {
            console.dir(error)
            if (error.message == "invalid token signature") {
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    }

    function openModal() {
        createChatModal.current.style.display = "flex";
    }

    function closeModal() {
        createChatModal.current.style.display = "none";
    }

    async function addUser(event) {
        if (event.key === "Enter") {

            const input = {
                usernames: [usernameInput]
            }
    
            try {
                const response = await grpc.auth.getUserIDs(input);
                setAddedUsername(usernameInput);
                setAddedUserID(response.response.userIds[usernameInput]);
            } catch (error) {
                console.dir(error)
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
            closeModal()
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
                    <input onClick={createChat} type="submit" value="create chat"/>
                    <div onClick={closeModal} className="close-modal"></div>
                </div>
            </div>
            <div className="chats-container">
                <div className="chats-list">
                    <div onClick={openModal} className="create-chat-button">create chat</div>
                    {chats.map((item, index) => (
                        <ChatButton chatId={item.chatId} name={item.name} key={index} />
                    ))}
                </div>
                <div className="chat-section">
                    <Routes>
                        <Route path=":chatId/*" element={<ChatSection />} />
                        <Route path="*" element={<ChatSection isEmpty={true} />} />
                    </Routes>
                </div>
            </div>
        </>
    )
}