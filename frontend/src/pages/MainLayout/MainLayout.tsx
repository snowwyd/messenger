import { useRef } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Navigation from '@/widgets/Navigation/Navigation';
import AudioPlayer from '@/widgets/AudioPlayer/AudioPlayer';
import ChatList from '@/widgets/ChatList/ChatList';
import Page from '@/widgets/Page/Page';
import Resizer from '@/shared/widgets/Resizer/Resizer';

import styles from './MainLayout.module.css';

export default function MainLayout() {
    const resizableRef = useRef(null);

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar} ref={resizableRef}>
                <Resizer className={styles.sidebarResizer} resizableRef={resizableRef} clamp={[200, 400]} />
                <Navigation />
                <nav className={styles.listContainer}>
                    <Routes>
                        <Route path="direct" element={<ChatList type={'direct'} />} />
                        <Route path="groups" element={<ChatList type={'groups'} />} />
                        <Route path="*" element={<Navigate to="/direct" />} />
                    </Routes>
                </nav>
                <AudioPlayer />
            </aside>
            <main className={styles.content}>
                <Page />
            </main>
        </div>
    );
}
