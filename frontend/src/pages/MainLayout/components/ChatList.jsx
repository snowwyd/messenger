import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import styles from './ChatList.module.css';

export default function ChatList({ chats }) {
    return (
        <div className={styles.chatList}>
            {chats.map((item, index) => <ChatButton chatId={item.chatId} name={item.name} key={index} />)}
        </div>
    )
}

function ChatButton({ chatId, name }) {
    const categoryState = useSelector(state => state.category.currentCategory);
    const setChatButtonClasses = navData => [styles.chatButton, navData.isActive && styles.activeChat].filter(Boolean).join(' ');

    return (
        <NavLink className={setChatButtonClasses} to={`/${categoryState}/${chatId}`} draggable="false">
            <div className={styles.avatarBlock}></div>
            <p>{name}</p>
        </NavLink>
    )
}