import { useState } from 'react';

import type { ChatType } from '@/types/ChatType.js';

import CreateDM from './Modals/CreateDM.jsx';
import CreateGroup from './Modals/CreateGroup.jsx';

import styles from './CreateChat.module.css';

interface CreateChatProps {
    type: ChatType;
}

export default function CreateChat({ type }: CreateChatProps) {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <>
            {isOpened && type === 'private' && <CreateDM closeModal={() => setIsOpened(false)} />}
            {isOpened && type === 'group' && <CreateGroup closeModal={() => setIsOpened(false)} />}
            <button onClick={() => setIsOpened((prev) => !prev)} className={styles.createChatButton}></button>
        </>
    );
}
