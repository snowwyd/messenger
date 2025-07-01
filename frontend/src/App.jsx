import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import AuthPage from '@/pages/Auth/Auth.jsx';
import MainLayoutPage from '@/pages/MainLayout/MainLayout.jsx';

export default function App() {
    const isAuthorized = useSelector((state) => state.auth.isAuth);

    return isAuthorized ? (
        <MainLayoutPage />
    ) : (
        <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
