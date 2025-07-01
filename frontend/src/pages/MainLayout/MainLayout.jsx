import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Categories from './components/Categories';
import Chat from '@/pages/Chat/Chat.jsx';

import Direct from '@/categories/Direct.jsx';
import Groups from '@/categories/Groups.jsx';

import styles from './MainLayout.module.css';

export default function MainLayout() {
    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <Categories />
                <Routes>
                    <Route path="/direct" element={<Direct />} />
                    <Route path="/groups" element={<Groups />} />
                    <Route path="*" element={<Navigate to="/direct" />} />
                </Routes>
            </div>
            <Page />
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
                <Chat chatId={currentPageURL[0]} channelId={currentPageURL[1]} />
            )}
        </>
    );
}
