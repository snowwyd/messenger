import { memo, useState } from 'react';
import Scroll from '@/components/Scroll/Scroll';

import emojis from 'emoji.json';
import styles from './EmojiBlock.module.css';

const LOAD_EMOJI_THRESHOLD = 20;

const EmojiBlock = memo(function EmojiBlock({ setText, inputRef }) {
    const [visibleCount, setVisibleCount] = useState(200);

    const loadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 200, emojis.length));
    };

    function onScrollCallback({ scrollTop, scrollHeight, clientHeight }) {
        if (scrollTop + clientHeight >= scrollHeight - LOAD_EMOJI_THRESHOLD) {
            loadMore();
        }
    }

    return (
        <div className={styles.emojiBlock}>
            <Scroll className={styles.emojiContainer} onScrollCallback={onScrollCallback}>
                {emojis.slice(0, visibleCount).map((item, index) => (
                    <Emoji emoji={item} setText={setText} key={index} inputRef={inputRef} />
                ))}
            </Scroll>
        </div>
    );
});

function Emoji({ emoji, setText, inputRef }) {
    const pasteEmoji = () => {
        const input = inputRef.current;
        const start = input.selectionStart;
        const end = input.selectionEnd;

        setText((prev) => prev.slice(0, start) + emoji.char + prev.slice(end));

        setTimeout(() => {
            input.focus();
            input.selectionStart = input.selectionEnd = start + emoji.char.length;
        }, 0);
    };

    return (
        <div onClick={pasteEmoji} className={styles.emoji}>
            {emoji.char}
        </div>
    );
}

export default EmojiBlock;
