import { useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Navigation from './Navigation/Navigation.jsx';

import ChatList from './Categories/ChatList/ChatList.jsx';
import Chat from './Pages/Chat/Chat.jsx';
import GroupChat from './Pages/Chat/GroupChat.jsx';

import styles from './MainLayout.module.css';
import Resizer from '@/shared/components/Resizer/Resizer.jsx';

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
    const currentPageURL = useSelector((state) => state.category.currentPageURL);
    const categoryOfThePage = useSelector((state) => state.category.categoryOfThePage);

    return (
        <>
            {(!categoryOfThePage || !currentPageURL) && <Chat />}
            {categoryOfThePage === 'direct' && currentPageURL && (
                <Chat chatId={currentPageURL[0]} channelId={currentPageURL[1]} />
            )}
            {categoryOfThePage === 'groups' && currentPageURL && (
                <GroupChat chatId={currentPageURL[0]} channelId={currentPageURL[1]} />
            )}
        </>
    );
}
