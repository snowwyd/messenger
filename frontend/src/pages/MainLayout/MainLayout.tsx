import { useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import type { State } from '@/types/State';
import Resizer from '@/shared/components/Resizer/Resizer';

import Navigation from './Navigation/Navigation';
import ChatList from './Categories/ChatList/ChatList';
import Chat from './Pages/Chat/Chat';
import GroupChat from './Pages/Chat/GroupChat';

import styles from './MainLayout.module.css';

export default function MainLayout() {
    const resizableRef = useRef(null);

    return (
        <div className={styles.container}>
            <div className={styles.sidebar} ref={resizableRef}>
                <Resizer className={styles.sidebarResizer} resizableRef={resizableRef} clamp={[200, 400]} />
                <Navigation />
                <Category />
            </div>
            <Page />
        </div>
    );
}

function Category() {
    return (
        <div className={styles.listContainer}>
            <Routes>
                <Route path="/direct" element={<ChatList type={'direct'} />} />
                <Route path="/groups" element={<ChatList type={'groups'} />} />
                <Route path="*" element={<Navigate to="/direct" />} />
            </Routes>
        </div>
    );
}

function Page() {
    const currentPageURL = useSelector((state: State) => state.category.currentPageURL);
    const categoryOfThePage = useSelector((state: State) => state.category.categoryOfThePage);

    return (
        <>
            {(!categoryOfThePage || !currentPageURL) && <div className={styles.plug}></div>}
            {categoryOfThePage === 'direct' && currentPageURL && (
                <Chat chatId={currentPageURL[0]} channelId={currentPageURL[1]} />
            )}
            {categoryOfThePage === 'groups' && currentPageURL && (
                <GroupChat chatId={currentPageURL[0]} channelId={currentPageURL[1]} />
            )}
        </>
    );
}
