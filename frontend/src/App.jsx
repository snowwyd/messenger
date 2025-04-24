import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { categoryActions } from "@/store/store.js";
import Auth from "@/pages/Auth/Auth.jsx";
import MainLayout from "@/pages/MainLayout/MainLayout.jsx";
import Chat from "@/pages/Chat/Chat.jsx";

export default function App() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const urlCategory = useLocation().pathname.split('/')[1];
    const authState = useSelector(state => state.auth.isAuth);

    useEffect(() => {
        if (authState) navigate('/direct');
        else navigate('/');
    }, [authState]);

    useEffect(() => {
        if (urlCategory === 'direct') dispatch(categoryActions.direct());
        else if (urlCategory === 'groups') dispatch(categoryActions.groups());
    }, [urlCategory]);

    return (
        <Routes>
            <Route path="/" element={authState ? <MainLayout /> : <Auth />}>
                <Route path="direct/:chatId?/:channelId?" element={<Chat />} />
                <Route path="groups/:chatId?/:channelId?" element={<Chat />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    )
}