import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Auth from '@/pages/Auth/Auth.jsx';
import MainLayout from '@/pages/MainLayout/MainLayout.jsx';

export default function App() {
    const isAuthorized = useSelector((state) => state.auth.isAuth);

    return isAuthorized ? (
        <MainLayout />
    ) : (
        <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}
