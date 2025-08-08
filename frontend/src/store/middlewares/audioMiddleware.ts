import { Middleware } from '@reduxjs/toolkit';
import { audioManager } from '@/services/audioManager';
import { play, pause, stop, resume, updateProgress, setProgress, setDuration, setVolume } from '../slices/audioSlice';

export const audioMiddleware: Middleware = (store) => {
    audioManager.setOnEnded(() => {
        store.dispatch(pause());
    });
    audioManager.setOnTimeUpdate((time) => {
        store.dispatch(updateProgress(time));
    });
    audioManager.setOnMetadataLoad((duration) => {
        store.dispatch(setDuration(duration));
    });

    return (next) => (action) => {
        if (play.match(action)) {
            audioManager.play(action.payload);
        }

        if (stop.match(action)) {
            audioManager.stop();
        }

        if (pause.match(action)) {
            audioManager.pause();
        }

        if (resume.match(action)) {
            audioManager.resume();
        }

        if (setProgress.match(action)) {
            audioManager.setProgress(action.payload);
        }

        if (setVolume.match(action)) {
            audioManager.setVolume(action.payload);
        }

        return next(action);
    };
};
