import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { State } from '@/types/State';
import AuthPage from '@/pages/Auth/Auth';
import MainLayoutPage from '@/pages/MainLayout/MainLayout';

export default function App() {
    const isAuthorized = useSelector((state: State) => state.auth.isAuth);

    return (
        <main>
            {isAuthorized ? (
                <MainLayoutPage />
            ) : (
                <Routes>
                    <Route path="/" element={<AuthPage />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            )}
        </main>
    );
}
