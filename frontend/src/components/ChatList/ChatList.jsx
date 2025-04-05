import { useContext } from "react";
import { NavLink } from "react-router-dom";

import styles from './ChatList.module.css';
import { useSelector } from "react-redux";

export default function ChatList({ chats }) {
    return (
        <div className={styles.chatList}>
            {chats.map((item, index) => <ChatButton chatId={item.chatId} name={item.name} key={index} />)}
        </div>
    )
}

function ChatButton({ chatId, name }) {
    const categoryState = useSelector((state) => state.category.currentCategory);

    function setChatButtonClasses({ isActive }) {
        return `${styles.chatButton} ${isActive ? styles.activeChat : ''}`;
    }

    return (
        <NavLink className={setChatButtonClasses} draggable="false" to={`/${categoryState}/${chatId}`}>
            <div className={styles.avatarBlock}></div>
            <p>{name}</p>
        </NavLink>
    )
}