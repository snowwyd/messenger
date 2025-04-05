import { configureStore } from "@reduxjs/toolkit";

const initialAuthState = {
    isAuth: localStorage.getItem('token') ? true : false
}

const initialCategoryState = {
    currentCategory: null
}

function authReducer(state = initialAuthState, action) {
    switch (action.type) {
        case 'authorize':
            return { ...state, isAuth: true };
        case 'deauthorize':
            return { ...state, isAuth: false };
        default:
            return state;
    }
}

function categoryReducer(state = initialCategoryState, action) {
    switch (action.type) {
        case 'direct':
            return { ...state, currentCategory: 'direct' };
        case 'groups':
            return { ...state, currentCategory: 'groups' };
        default:
            return state;
    }
}

export const store = configureStore({
    reducer: {
        auth: authReducer,
        category: categoryReducer
    }
});