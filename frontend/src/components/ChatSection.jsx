import { useEffect, useContext, useState, useRef } from "react";
import { useLocation, useParams, useNavigate, Routes, Route } from "react-router-dom"

import { AppContext } from "../AppContext";
import MessagesWindow from "./MessagesWindow";
import Channel from "./Channel";

import './ChatSection.css'

export default function ChatSection({ isEmpty }) {
    const grpc = useContext(AppContext);
    const location = useLocation();
    const { chatId } = useParams();
    const navigate = useNavigate();

    const [channels, setChannels] = useState([]);
    const [channelName, setChannelName] = useState("");

    useEffect(() => {
        if (!isEmpty) {
            getChatInfo();
        }
    }, [location.pathname]);

    async function getChatInfo() {
        const input = {
            chatId: chatId
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.getChatInfo(input, rpcOptions);
            setChannels(response.response.channels);
        } catch (error) {
            console.log(error);
        }
    }

    async function createChannel() {
        const input = {
            chatId: chatId,
            name: channelName,
            type: "text"
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.createChannel(input, rpcOptions);
            setChannelName("");
            getChatInfo();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <>
            <div className="messages-window-container">
                <Routes>
                    <Route path=":channelId" element={<MessagesWindow />} />
                </Routes>
            </div>
            <div className="chat-details">
                <div className="members-info"></div>
                <div className="channels-list">
                    {!isEmpty && channels.map((item, index) => <Channel item={item} key={index} />)}
                    
                    <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className="create-channel-name" placeholder="channel name" type="text" />
                    <div onClick={createChannel} className="create-channel"></div>
                </div>
            </div>
        </>
    )
}