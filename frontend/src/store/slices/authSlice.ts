import { createSlice } from '@reduxjs/toolkit';

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

export const { authorize, deauthorize } = authSlice.actions;
export default authSlice.reducer;
