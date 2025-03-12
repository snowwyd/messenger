import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import AppProvider from "./AppContext.jsx";
import Auth from "./pages/Auth.jsx";
import MainPage from "./pages/MainPage.jsx";

export default function App() {
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem('user_id');
        if (localStorage.getItem('token')) {
            navigate('/chats');
        } else {
            navigate('/');
        }
    }, []);

    return (
        <AppProvider>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/chats/:chatId?/:channelId?" element={<MainPage />} />
            </Routes>
        </AppProvider>
    )
}