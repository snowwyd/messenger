import { createSlice, configureStore } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isAuth: !!localStorage.getItem('token'),
        token: localStorage.getItem('token') || null,
    },
    reducers: {
        authorize: function (state, action) {
            state.isAuth = true;
            state.token = action.payload;
        },
        deauthorize: function (state) {
            state.isAuth = false;
            state.token = null;
        },
    },
});

const categorySlice = createSlice({
    name: 'category',
    initialState: {
        currentPageURL: JSON.parse(localStorage.getItem('currentPageURL')) || null,
        categoryOfThePage: localStorage.getItem('categoryOfThePage') || null,
    },
    reducers: {
        direct: function (state) {
            state.categoryOfThePage = 'direct';
        },
        groups: function (state) {
            state.categoryOfThePage = 'groups';
        },
        setCurrentPage: function (state, action) {
            state.currentPageURL = action.payload;
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

const categoryMiddleware = (store) => (next) => (action) => {
    const result = next(action);

    const state = store.getState();
    const currentPageURL = state.category.currentPageURL;
    const categoryOfThePage = state.category.categoryOfThePage;

    if (currentPageURL) localStorage.setItem('currentPageURL', JSON.stringify(currentPageURL));
    else localStorage.removeItem('currentPageURL');

    if (categoryOfThePage) localStorage.setItem('categoryOfThePage', categoryOfThePage);
    else localStorage.removeItem('categoryOfThePage');

    return result;
};

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        category: categorySlice.reducer,
    },
    middleware: function (getDefaultMiddleware) {
        return getDefaultMiddleware().concat(tokenMiddleware, categoryMiddleware);
    },
});

export const authActions = authSlice.actions;
export const categoryActions = categorySlice.actions;
