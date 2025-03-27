import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AppContext } from "../../AppContext";
import Scroll from "../Scroll/Scroll";
import CreateChannel from "../CreateChannel/CreateChannel";

import styles from './ChannelList.module.css';

export default function ChannelList({ chatId, channels }) {
    const { categoryState } = useContext(AppContext);

    return (
        <>
            <Scroll wrapperClass={styles.channelList}>
                {channels.map((item, index) => <Channel category={categoryState.currentCategory} chatId={chatId} channelId={item.channelId} channelName={item.name} key={index} />)}
                <CreateChannel />
            </Scroll>
        </>
    )
}

function Channel({ category, chatId, channelId, channelName }) {

    function setChannelClasses({ isActive }) {
        return [styles.channel, isActive && styles.activeChannel].filter(Boolean).join(' ')
    }

    return (
        <NavLink className={setChannelClasses} draggable="false" to={`/${category}/${chatId}/${channelId}`}>
            <div className={styles.channelIcon}></div>
            {channelName}
        </NavLink>
    )
}