import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/shared/hooks/useAuthStore';
import Auth from '@/pages/Auth/Auth';
import MainLayout from '@/pages/MainLayout/MainLayout';

export default function AppRouter() {
    const { isAuth } = useAuthStore();
    const location = useLocation();

    if (!isAuth && location.pathname === '/') {
        return <Auth />;
    }

    if (!isAuth) {
        return <Navigate to="/" replace />;
    }

    return <MainLayout />;
}
