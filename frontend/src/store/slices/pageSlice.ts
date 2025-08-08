import { createSlice } from '@reduxjs/toolkit';

const pageSlice = createSlice({
    name: 'page',
    initialState: {
        category: localStorage.getItem('category') || null,
        chatId: localStorage.getItem('chatId') || null,
        channelId: localStorage.getItem('channelId') || null,
    },
    reducers: {
        direct: function (state) {
            state.category = 'direct';
        },
        groups: function (state) {
            state.category = 'groups';
        },
        setChannelId: function (state, action) {
            state.channelId = action.payload;
        },
        setChatId: function (state, action) {
            state.chatId = action.payload;
        },
    },
});

export const { direct, groups, setChannelId, setChatId } = pageSlice.actions;
export default pageSlice.reducer;
