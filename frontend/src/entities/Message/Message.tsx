import { memo } from 'react';
import Linkify from 'linkify-react';
import * as linkify from 'linkifyjs';

import Embed from '@/entities/Embed/Embed';
import type { Message as MessageType } from '@/proto/gen/chat';
import { isDirectFileLink, isEmbeddableLink } from '@/shared/utils/url';

import styles from './Message.module.css';

interface MessageProps {
    prevMessage: MessageType;
    message: MessageType;
    usernames: Record<string, string>;
}

interface MessageContentProps {
    text: string;
}

const Message = memo(function Message({ prevMessage, message, usernames }: MessageProps) {
    const isFirstMessage = prevMessage === undefined ? true : false;
    const isFirstInGroup = isFirstMessage || prevMessage.senderId !== message.senderId;

    const date = new Date(Number(message.createdAt?.seconds) * 1000);

    const dateLabel = date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

    const dateString = date.toLocaleDateString();

    const timeString = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });

    const prevDate = !isFirstMessage ? new Date(Number(prevMessage.createdAt?.seconds) * 1000) : date;

    const isAnotherDay = date.toLocaleDateString() !== prevDate.toLocaleDateString() || isFirstMessage ? true : false;
    const halfHour = (date.getTime() - prevDate.getTime()) / 60000 > 30;

    return (
        <>
            {isAnotherDay && (
                <div className={styles.dateLabel}>
                    <span>{dateLabel}</span>
                </div>
            )}
            <div className={styles.message} data-id={message.messageId}>
                {isFirstInGroup || isAnotherDay || halfHour ? (
                    <div className={styles.messageUserInfo}>
                        <div className={styles.avatar}></div>
                        <div className={styles.usernameMessage}>
                            <span className={styles.username}>
                                {usernames[message.senderId]}
                                <span className={styles.dateCaption}>
                                    {dateString} {timeString}
                                </span>
                            </span>
                            <MessageContent text={message.text} />
                        </div>
                    </div>
                ) : (
                    <div className={styles.messageContainer}>
                        <div className={styles.timeCaption}>{timeString}</div>
                        <MessageContent text={message.text} />
                    </div>
                )}
            </div>
        </>
    );
});

function MessageContent({ text }: MessageContentProps) {
    const options = {
        target: '_blank',
        rel: 'noopener noreferrer',
    };

    const links = linkify.find(text);

    const urls = links.map((link) => link.href);
    const hasEmbed = isEmbeddableLink(urls);

    const isSingleLink = links.length === 1 && links[0].href === text && isDirectFileLink(links[0].href);

    return (
        <div className={styles.messageContent}>
            {!isSingleLink && (
                <div className={styles.messageText}>
                    <Linkify options={options}>{text}</Linkify>
                </div>
            )}
            {hasEmbed && (
                <div className={styles.embeds}>
                    {links.map((item) => (
                        <Embed url={item.href} key={item.href}></Embed>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Message;
