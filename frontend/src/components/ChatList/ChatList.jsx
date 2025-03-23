import { useContext } from "react";
import { NavLink } from "react-router-dom";

import { AppContext } from "../../AppContext";

import './ChatList.css';

export default function ChatList({ chats }) {
    return (
        <div className="chat-list">
            {chats.map((item, index) => <ChatButton chatId={item.chatId} name={item.name} key={index} />)}
        </div>
    )
}

function ChatButton({ chatId, name }) {
    const { categoryState } = useContext(AppContext);
    
    return (
        <NavLink className="chat-button" draggable="false" to={`/${categoryState.currentCategory}/${chatId}`}>
            <div className="avatar-block"></div>
            <p className="chat-name">{name}</p>
        </NavLink>
    )
}