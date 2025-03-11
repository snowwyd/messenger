import { NavLink, useParams } from 'react-router-dom';

import './Channel.css';

export default function Channel({ item }) {
    const { chatId } = useParams();

    return (
        <NavLink className="channel" draggable="false" to={`/chats/${chatId}/${item.channelId}`}># {item.name}</NavLink>
    )
}