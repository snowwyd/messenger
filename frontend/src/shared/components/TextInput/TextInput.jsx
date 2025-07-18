import { useEffect, useRef, useState } from 'react';

import EmojiBlock from './EmojiBlock/EmojiBlock.jsx';

import styles from './TextInput.module.css';

export default function TextInput({ onSend, placeholder }) {
    const textareaRef = useRef(null);
    const [text, setText] = useState('');
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => textareaRef.current?.focus(), [isEmojiBlock]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '45px';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    function onKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    }

    function sendMessage() {
        if (text.trim().replace(/\n/g, '') === '') return setText('');
        onSend(text);
        setText('');
    }

    function handleFileChange(event) {
        const file = event.target.files[0];
        console.log('Выбран файл:', file);
    }

    return (
        <div className={styles.messageFieldContainer}>
            <div className={styles.messageField}>
                <div className={styles.writeMessageIcon}></div>
                <textarea
                    ref={textareaRef}
                    onKeyDown={onKeyDown}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={placeholder}
                />
                <div className={`${styles.button} ${styles.fileButton}`} onClick={() => fileInputRef.current.click()}>
                    <input ref={fileInputRef} onChange={handleFileChange} type="file" style={{ display: 'none' }} />
                </div>
                <div className={`${styles.button} ${styles.favoriteButton}`}></div>
                <div
                    className={`${styles.button} ${styles.emojiButton}`}
                    onClick={() => setIsEmojiBlock((prev) => !prev)}
                ></div>
                <div className={styles.sendMessageButton} onClick={sendMessage}></div>
                {isEmojiBlock && <EmojiBlock setText={setText} inputRef={textareaRef} />}
            </div>
        </div>
    );
}
