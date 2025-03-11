import { useContext, useEffect, useState } from 'react';
import './Message.css'

import { AppContext } from "../AppContext";

export default function Message({ messages, item, index }) {
    const isFirstInGroup = index === 0 || messages[index - 1].senderId !== item.senderId;

    const grpc = useContext(AppContext);
    const [username, setUsername] = useState("");

    useEffect(() => {
        getUsername();
    }, []);

    async function getUsername() {
        const input = {
            userIds: [item.senderId]
        }

        try {
            const response = await grpc.auth.getUsernames(input);
            setUsername(response.response.usernames[item.senderId]);
        } catch (error) {
            console.dir(error)
        }
    }

    return (
        <div className="message">
            {isFirstInGroup ? (
                <div className="message-user-info">
                    <div className="avatar"></div>
                    <div className="username-message">
                        <span className="username">{username}</span>
                        <pre className="message-text">{item.text}</pre>
                    </div>
                </div>
            ) : (
                <pre className="message-text">{item.text}</pre>
            )}
        </div>
    )
}