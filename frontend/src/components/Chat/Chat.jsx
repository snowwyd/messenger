import { useContext, useEffect, useRef, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';

import { AppContext } from "../../AppContext";
import Messages from "../Messages/Messages";
import Scroll from "../Scroll/Scroll";

import './Chat.css'

export default function Chat() {
    const { grpc, categoryState } = useContext(AppContext);
    const { chatId, channelId } = useParams();

    const [channelName, setChannelName] = useState("");

    const { data: chatInfo, isError, error, isLoading } = useQuery({ queryKey: ['chatInfo', chatId], queryFn: getChatInfo });

    if (isError) {
        console.log(error.message);
        if (error.message === "invalid token signature") localStorage.removeItem('token');
    }

    async function getChatInfo() {
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const { response } = await grpc.chat.getChatInfo({ chatId: chatId }, rpcOptions);
        const call = await grpc.auth.getUsernames({ userIds: response.memberIds });
        response.usernames = call.response.usernames;
        return response;
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
                {channelId && !isLoading && !isError && <Messages channelId={channelId} membersUsernames={chatInfo.usernames} />}
            </div>
            <div className="chat-details">
                <div className="members-info"></div>
                <div className="channels-list-container">
                <Scroll wrapperClass={"channels-list"}>
                    {chatId && !isLoading && !isError && (
                        <>
                            {chatInfo.channels.map((item, index) => <NavLink className="channel" draggable="false" to={`/${categoryState.currentCategory}/${chatId}/${item.channelId}`} key={index}># {item.name}</NavLink>)}
                            <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className="create-channel-name" placeholder="channel name" type="text" />
                            <div onClick={createChannel} className="create-channel"></div>
                        </>
                    )}
                </Scroll>
                </div>
            </div>
        </div>
    )
}