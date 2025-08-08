import { useDispatch, useSelector } from 'react-redux';
import type { State } from '@/shared/types/State';
import { play, pause, stop, setProgress, setVolume, resume, setCoverUrl } from '@/store/slices/audioSlice';

export function useAudioStore() {
    const audioState = useSelector((state: State) => state.audio);
    const dispatch = useDispatch();

    return {
        ...audioState,
        play: (url: string) => dispatch(play(url)),
        pause: () => dispatch(pause()),
        stop: () => dispatch(stop()),
        resume: () => dispatch(resume()),
        setProgress: (progress: number) => dispatch(setProgress(progress)),
        setVolume: (duration: number) => dispatch(setVolume(duration)),
        setCoverUrl: (url: string | null) => dispatch(setCoverUrl(url)),
    };
}
