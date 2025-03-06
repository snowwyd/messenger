import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import AppProvider from "./AppContext.jsx";
import Auth from "./pages/Auth.jsx";
import Chats from "./pages/Chats.jsx";

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (localStorage.getItem('token') != null) {
            navigate('/chats');
        } else {
            navigate('/');
        }
    }, []);

    return (
        <AppProvider>
            <Routes>
                <Route path="/" element={<Auth />}/>
                <Route path="/chats/*" element={<Chats />} />
            </Routes>
        </AppProvider>
    )
}