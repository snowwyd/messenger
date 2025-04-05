import { useContext, useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Auth from "@/pages/Auth/Auth.jsx";
import MainLayout from "@/pages/MainLayout/MainLayout.jsx";
import Chat from "@/components/Chat/Chat.jsx";

export default function App() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth.isAuth);
    const categoryState = useSelector((state) => state.category.currentCategory);
    const location = useLocation();

    useEffect(() => {
        console.log(authState);
        
        if (authState === true) {
            navigate('/direct');
        } else {
            localStorage.removeItem('token');
            navigate('/');
        }
    }, [authState]);

    useEffect(() => {
        console.log(categoryState);
        dispatch({ type: location.pathname.split('/')[1] });
    }, [location.pathname.split('/')[1]]);

    return (
        <Routes>
            <Route path="/" element={authState ? <MainLayout /> : <Auth />}>
                <Route path="direct/:chatId?/:channelId?" element={<Chat />} />
                <Route path="groups/:chatId?/:channelId?" element={<Chat />} />
            </Route>
        </Routes>
    )
}