import { Middleware } from '@reduxjs/toolkit';

export const pageMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    const state = store.getState();

    const category = state.page.category;
    const chatId = state.page.chatId;
    const channelId = state.page.channelId;

    if (category) localStorage.setItem('category', category);
    else localStorage.removeItem('category');

    if (chatId) localStorage.setItem('chatId', chatId);
    else localStorage.removeItem('chatId');

    if (channelId) localStorage.setItem('channelId', channelId);
    else localStorage.removeItem('channelId');

    return result;
};
