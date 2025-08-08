import { createSlice } from '@reduxjs/toolkit';

const audioSlice = createSlice({
    name: 'audio',
    initialState: {
        src: null,
        isPlaying: false,
        progress: 0,
        volume: 0,
        duration: 0,
        coverUrl: null,
    },
    reducers: {
        play: (state, action) => {
            state.src = action.payload;
            state.isPlaying = true;
        },
        stop: (state) => {
            state.isPlaying = false;
            state.src = null;
            state.progress = 0;
        },
        resume: (state) => {
            state.isPlaying = true;
        },
        pause: (state) => {
            state.isPlaying = false;
        },
        setDuration: (state, action) => {
            state.duration = action.payload;
        },
        updateProgress: (state, action) => {
            state.progress = action.payload;
        },
        setProgress: (state, action) => {
            state.progress = action.payload;
        },
        setVolume: (state, action) => {
            state.volume = action.payload;
        },
        setCoverUrl: (state, action) => {
            state.coverUrl = action.payload;
        },
    },
});

export const { play, pause, stop, resume, updateProgress, setProgress, setVolume, setCoverUrl, setDuration } =
    audioSlice.actions;
export default audioSlice.reducer;
