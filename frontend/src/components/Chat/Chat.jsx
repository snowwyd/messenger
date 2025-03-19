import { useEffect, useContext, useState } from "react";
import { useParams, NavLink } from "react-router-dom"

import { AppContext } from "../../AppContext";
import Messages from "../Messages/Messages";

import './Chat.css'

export default function Chat() {
    const { grpc, categoryState } = useContext(AppContext);
    const { chatId, channelId } = useParams();

    const [channelName, setChannelName] = useState("");
    const [channels, setChannels] = useState([]);
    const [membersUsernames, setMembersUsernames] = useState({});

    useEffect(() => {
        if (chatId) {
            setChannels([]);
            getChatInfo();
        }
    }, [chatId]);

    async function getChatInfo() {
        const input = {
            chatId: chatId
        }

        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));

        try {
            const response = await grpc.chat.getChatInfo(input, rpcOptions);
            setChannels(response.response.channels);
            const response2 = await grpc.auth.getUsernames({ userIds: response.response.memberIds });
            setMembersUsernames(response2.response.usernames);
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
            await grpc.chat.createChannel(input, rpcOptions);
            setChannelName("");
            getChatInfo();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="chat">
            <div className="messages-window-container">
                {channelId && <Messages channelId={channelId} membersUsernames={membersUsernames} />}
            </div>
            <div className="chat-details">
                <div className="members-info"></div>
                <div className="channels-list">
                    {chatId && (
                        <>
                            {channels.map((item, index) => <NavLink className="channel" draggable="false" to={`/${categoryState.currentCategory}/${chatId}/${item.channelId}`} key={index}># {item.name}</NavLink>)}
                            <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className="create-channel-name" placeholder="channel name" type="text" />
                            <div onClick={createChannel} className="create-channel"></div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}