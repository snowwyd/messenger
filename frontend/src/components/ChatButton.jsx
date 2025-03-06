import { NavLink } from "react-router-dom";

import './ChatButton.css';

export default function ChatButton({ chatId, index }) {
    return (
        <NavLink className="chat-button" to={`/chats/${chatId}`}>
            <div className="avatar-block"></div>
            <p className="chat-name">username_{index}</p>
        </NavLink>
    )
}