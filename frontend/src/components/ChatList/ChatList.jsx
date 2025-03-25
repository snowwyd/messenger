import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AppContext } from "../../AppContext";

import styles from './ChatList.module.css';

export default function ChatList({ chats }) {
    return (
        <div className={styles.chatList}>
            {chats.map((item, index) => <ChatButton chatId={item.chatId} name={item.name} key={index} />)}
        </div>
    )
}

function ChatButton({ chatId, name }) {
    const { categoryState } = useContext(AppContext);

    function setChatButtonClasses({ isActive }) {
        return `${styles.chatButton} ${isActive ? styles.activeChat : ''}`;
    }

    return (
        <NavLink className={setChatButtonClasses} draggable="false" to={`/${categoryState.currentCategory}/${chatId}`}>
            <div className={styles.avatarBlock}></div>
            <p>{name}</p>
        </NavLink>
    )
}