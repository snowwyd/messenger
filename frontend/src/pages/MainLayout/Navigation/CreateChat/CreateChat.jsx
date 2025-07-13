import { useState } from 'react';

import CreateDM from './Modals/CreateDM.jsx';
import CreateGroup from './Modals/CreateGroup.jsx';

import styles from './CreateChat.module.css';

export default function CreateChat({ type }) {
    const [isOpened, setIsOpened] = useState(false);

    return (
        <>
            {isOpened && type === 'private' && <CreateDM closeModal={() => setIsOpened(false)} />}
            {isOpened && type === 'group' && <CreateGroup closeModal={() => setIsOpened(false)} />}
            <div onClick={() => setIsOpened((prev) => !prev)} className={styles.createChatButton}></div>
        </>
    );
}
