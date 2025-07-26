import { memo, useState } from 'react';
import emojiJson from 'emoji.json';

import Scroll from '@/shared/components/Scroll/Scroll';
import Input from '@/shared/ui/Input/Input.jsx';
import SearchIcon from '@/assets/icons/search.svg';

import styles from './EmojiBlock.module.css';

type EmojiType = (typeof emojiJson)[number];

interface EmojiBlockProps {
    setText: React.Dispatch<React.SetStateAction<string>>;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface EmojiProps {
    emoji: EmojiType;
    setText: React.Dispatch<React.SetStateAction<string>>;
    inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const emojis = emojiJson.filter((element) => !element.name.includes('skin tone'));

const LOAD_EMOJI_THRESHOLD = 100;
const EMOJI_BATCH_SIZE = 200;

const EmojiBlock = memo(function EmojiBlock({ setText, inputRef }: EmojiBlockProps) {
    const [visibleCount, setVisibleCount] = useState(EMOJI_BATCH_SIZE);
    const [showedEmojis, setShowedEmojis] = useState(emojis);

    const loadMore = () => {
        setVisibleCount((prev) => Math.min(prev + EMOJI_BATCH_SIZE, emojis.length));
    };

    function onScrollCallback({ scrollTop, scrollHeight, clientHeight }: HTMLDivElement) {
        if (scrollTop + clientHeight >= scrollHeight - LOAD_EMOJI_THRESHOLD) {
            loadMore();
        }
    }

    function searchEmoji(event: React.ChangeEvent<HTMLInputElement>) {
        setVisibleCount(EMOJI_BATCH_SIZE);

        if (event.target.value.length === 0) {
            setShowedEmojis(emojis);
            return;
        }

        const searchText = event.target.value.toLowerCase();
        const show = emojis.filter((element: EmojiType) => element.name.toLowerCase().includes(searchText));

        setShowedEmojis(show);
    }

    const renderedEmojis = showedEmojis.slice(0, visibleCount);

    return (
        <div className={styles.emojiBlock}>
            <Input onChange={searchEmoji} placeholder="Search" icon={SearchIcon} className={styles.searchInput} />
            <div className={styles.emojiContainer}>
                <Scroll className={styles.emojiGrid} onScrollCallback={onScrollCallback}>
                    {renderedEmojis.map((item) => (
                        <Emoji emoji={item} setText={setText} key={item.codes} inputRef={inputRef} />
                    ))}
                </Scroll>
            </div>
        </div>
    );
});

const Emoji = memo(function Emoji({ emoji, setText, inputRef }: EmojiProps) {
    function pasteEmoji() {
        const input = inputRef.current;
        const start = input?.selectionStart;
        const end = input?.selectionEnd;

        if (!start || !end) return;

        setText((prev) => prev.slice(0, start) + emoji.char + prev.slice(end));

        setTimeout(() => {
            input.focus();
            input.selectionStart = input.selectionEnd = start + emoji.char.length;
        }, 0);
    }

    return (
        <button onClick={pasteEmoji} className={styles.emoji}>
            {emoji.char}
        </button>
    );
});

export default EmojiBlock;
