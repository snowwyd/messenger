import { createSlice, configureStore } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuth: !!localStorage.getItem('token'),
        token: localStorage.getItem('token') || null,
    },
    reducers: {
        authorize: function (state, action) {
            return { isAuth: true, token: action.payload };
        },
        deauthorize: function (state) {
            return { isAuth: false, token: null };
        },
    },
});

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        currentCategory: null,
    },
    reducers: {
        direct: function (state) {
            return { currentCategory: 'direct' };
        },
        groups: function (state) {
            return { currentCategory: 'groups' };
        },
    },
});

const tokenMiddleware = (store) => (next) => (action) => {
    const result = next(action);

    const state = store.getState();
    const token = state.auth.token;

    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    return result;
};

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        category: categorySlice.reducer,
    },
    middleware: function (getDefaultMiddleware) {
        return getDefaultMiddleware().concat(tokenMiddleware);
    },
});

export const authActions = authSlice.actions;
export const categoryActions = categorySlice.actions;
