import { memo, useState } from 'react';
import Scroll from '@/components/Scroll/Scroll';

import emoji from 'emoji.json';
import styles from './EmojiBlock.module.css';

const EmojiBlock = memo(function EmojiBlock({ setText }) {
    const [visibleCount, setVisibleCount] = useState(200);

    const loadMore = () => {
        setVisibleCount((prev) => Math.min(prev + 200, emoji.length));
    };

    return (
        <div className={styles.emojiBlock}>
            <Scroll wrapperClass={styles.emojiContainer} loadEmoji={loadMore}>
                {emoji.slice(0, visibleCount).map((item, index) => (
                    <Emoji emoji={item} setText={setText} key={index} />
                ))}
            </Scroll>
        </div>
    );
});

function Emoji({ emoji, setText }) {
    const pasteEmoji = () => setText((prev) => prev + emoji.char);

    return (
        <div onClick={pasteEmoji} className={styles.emoji}>
            {emoji.char}
        </div>
    );
}

export default EmojiBlock;
