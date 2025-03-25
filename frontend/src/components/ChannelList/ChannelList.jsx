import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";

import { AppContext } from "../../AppContext";
import Scroll from "../Scroll/Scroll";

import styles from './ChannelList.module.css';

export default function ChannelList({ chatId, channels }) {
    const { grpc, categoryState } = useContext(AppContext);
    const [channelName, setChannelName] = useState("");

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
        <>
            <Scroll wrapperClass={styles.channelList}>
                {channels.map((item, index) => <Channel category={categoryState.currentCategory} chatId={chatId} channelId={item.channelId} channelName={item.name} key={index} />)}
            </Scroll>
            <input value={channelName} onChange={(event) => setChannelName(event.target.value)} className={styles.createChannelName} placeholder="channel name" type="text" />
            <div onClick={createChannel} className={styles.createChannel}></div>
        </>
    )
}

function Channel({ category, chatId, channelId, channelName }) {

    function setChannelClasses({ isActive }) {
        return [styles.channel, isActive && styles.activeChannel].filter(Boolean).join(' ')
    }

    return (
        <NavLink className={setChannelClasses} draggable="false" to={`/${category}/${chatId}/${channelId}`}># {channelName}</NavLink>
    )
}