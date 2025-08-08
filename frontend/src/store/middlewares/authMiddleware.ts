import { Middleware } from '@reduxjs/toolkit';

export const authMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    const state = store.getState();
    const token = state.auth.token;

    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    return result;
};
