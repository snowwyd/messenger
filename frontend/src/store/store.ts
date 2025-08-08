import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import pageReducer from './slices/pageSlice';
import audioReducer from './slices/audioSlice';

import { authMiddleware } from './middlewares/authMiddleware';
import { pageMiddleware } from './middlewares/pageMiddleware';
import { audioMiddleware } from './middlewares/audioMiddleware';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        page: pageReducer,
        audio: audioReducer,
    },
    middleware: function (getDefaultMiddleware) {
        return getDefaultMiddleware().concat(authMiddleware, pageMiddleware, audioMiddleware);
    },
});
