import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import EmojiBlock from './EmojiBlock/EmojiBlock';

import styles from './TextInput.module.css';

interface TextInputProps {
    onSend: (text: string) => void;
    placeholder: string;
}

export default function TextInput({ onSend, placeholder }: TextInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const [text, setText] = useState('');
    const [isEmojiBlock, setIsEmojiBlock] = useState(false);

    useEffect(() => textareaRef.current?.focus(), [isEmojiBlock]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.setProperty('height', '45px');
            textareaRef.current.style.setProperty('height', textareaRef.current.scrollHeight + 'px');
        }
    }, [text]);

    function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
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

    function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files) return;

        console.log('Выбран файл:', files[0]);
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
                <label className={clsx(styles.button, styles.fileButton)}>
                    <input
                        onChange={handleFileChange}
                        type="file"
                        style={{ display: 'none' }}
                        aria-label="upload file"
                    />
                </label>
                <button className={clsx(styles.button, styles.favoriteButton)}></button>
                <button
                    className={clsx(styles.button, styles.emojiButton)}
                    onClick={() => setIsEmojiBlock((prev) => !prev)}
                ></button>
                <button className={styles.sendMessageButton} onClick={sendMessage}></button>
                {isEmojiBlock && <EmojiBlock setText={setText} inputRef={textareaRef} />}
            </div>
        </div>
    );
}
