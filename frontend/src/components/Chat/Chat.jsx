import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { useGrpc } from "@/GrpcContext.jsx";

import Messages from "../Messages/Messages";
import ChannelList from "../ChannelList/ChannelList";

import styles from './Chat.module.css';
import { useDispatch } from "react-redux";

export default function Chat() {
    const { chatId, channelId } = useParams();
    const grpc = useGrpc();
    const dispatch = useDispatch();

    const chatInfo = useQuery({
        queryKey: ['chatInfo', chatId],
        queryFn: getChatInfo,
        cacheTime: 60 * 60000,
        enabled: !!chatId
    });

    useEffect(() => {
        if (chatInfo.isError) {
            console.log(chatInfo.error.message);
            if (chatInfo.error.message === "invalid token signature") dispatch({ type: 'deauthorize' });
        }
    }, [chatInfo.isError, chatInfo.error]);

    async function getChatInfo() {
        const rpcOptions = grpc.setAuthorizationHeader(localStorage.getItem('token'));
        const { response } = await grpc.chat.getChatInfo({ chatId: chatId }, rpcOptions);
        const call = await grpc.auth.getUsernames({ userIds: response.memberIds });
        response.usernames = call.response.usernames;
        return response;
    }

    return (
        <div className={styles.chat}>
            <div className={styles.messagesWindowContainer}>
                {channelId && !chatInfo.isLoading && !chatInfo.isError && <Messages channelId={channelId} membersUsernames={chatInfo.data.usernames} />}
            </div>
            <div className={styles.chatSidebar}>
                <div className={styles.chatDetailsContainer}></div>
                <div className={styles.channelListContainer}>
                    {chatId && !chatInfo.isLoading && !chatInfo.isError && <ChannelList chatId={chatId} channels={chatInfo.data.channels} />}
                </div>
            </div>
        </div>
    )
}