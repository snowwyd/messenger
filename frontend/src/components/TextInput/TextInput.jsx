import { useEffect, useRef, useState } from 'react';

import EmojiBlock from './EmojiBlock/EmojiBlock.jsx';

import styles from './TextInput.module.css';

export default function TextInput({ onSend, placeholder }) {
    const textareaRef = useRef(null);
    const [text, setText] = useState('');
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);

    useEffect(() => textareaRef.current?.focus(), [isEmojiBlock]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '50px';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    function onKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (text.trim().replace(/\n/g, '') === '') return setText('');

            onSend(text);

            setText('');
        }
    }

    return (
        <div className={styles.messageFieldContainer}>
            <div className={styles.messageField}>
                <textarea
                    ref={textareaRef}
                    onKeyDown={onKeyDown}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={placeholder}
                />
                <div className={styles.emojiButton} onClick={() => setIsEmojiBlock((prev) => !prev)}>
                    🤔
                </div>
                {isEmojiBlock && <EmojiBlock setText={setText} inputRef={textareaRef} />}
            </div>
        </div>
    );
}
