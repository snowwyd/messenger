import { useContext, useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import { AppContext } from "./AppContext";
import Auth from "./pages/Auth.jsx";
import MainLayout from "./pages/MainLayout.jsx";
import Chat from "./components/Chat/Chat.jsx";

export default function App() {
    const navigate = useNavigate();
    const { isAuthorizedState } = useContext(AppContext);

    useEffect(() => {
        console.log(123);
        
        if (isAuthorizedState.isAuthorized === true) {
            navigate('/chats');
        } else {
            localStorage.removeItem('token');
            navigate('/');
        }
    }, [isAuthorizedState.isAuthorized]);

    return (
        <Routes>
            <Route path="/" element={isAuthorizedState.isAuthorized ? <MainLayout /> : <Auth />}>
                <Route path="chats/:chatId?/:channelId?" element={<Chat />} />
                <Route path="groups/:chatId?/:channelId?" element={<Chat />} />
            </Route>
        </Routes>
    )
}