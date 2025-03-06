import './Message.css'

export default function Message({ messages, item, index }) {
    const isFirstInGroup = index === 0 || messages[index - 1].senderId !== item.senderId;

    return (
        <div className="message">
            {isFirstInGroup ? (
                <div className="message-user-info">
                    <div className="avatar"></div>
                    <div className="username-message">
                        <span className="username">{item.senderId}</span>
                        <pre className="message-text">{item.text}</pre>
                    </div>
                </div>
            ) : (
                <pre className="message-text">{item.text}</pre>
            )}
        </div>
    )
}