import { useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

import { useAudioStore } from '@/shared/hooks/useAudioStore';

import styles from './AudioPlayer.module.css';

export default function AudioPlayer() {
    const { src, coverUrl, stop, pause, resume, isPlaying, progress, duration, setProgress } = useAudioStore();

    const progressSlider = useRef<HTMLDivElement>(null);
    const progressSliderProgress = useRef<HTMLDivElement>(null);
    const progressSliderThumb = useRef<HTMLDivElement>(null);

    const isDraggingProgress = useRef(false);
    const progressLeft = useRef(0);

    const updateProgressbar = useCallback(() => {
        if (!progressSlider.current) return;
        const sliderRect = progressSlider.current.getBoundingClientRect();

        const newLeft = sliderRect.width * (progress / duration);

        progressSliderProgress.current!.style.width = `${newLeft}px`;
        progressSliderThumb.current!.style.left = `${newLeft}px`;
    }, [duration, progress]);

    const updateProgress = useCallback(() => {
        if (isDraggingProgress.current) {
            if (!progressSlider.current) return;
            const time = (progressLeft.current / progressSlider.current.getBoundingClientRect().width) * duration;

            setProgress(time);
        }

        isDraggingProgress.current = false;
    }, [duration, setProgress]);

    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (isDraggingProgress.current) {
            moveProgressThumb(event);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mouseup', updateProgress);
        document.addEventListener('mousemove', handleMouseMove);

        return () => {
            document.removeEventListener('mouseup', updateProgress);
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [handleMouseMove, updateProgress]);

    useEffect(() => {
        if (isDraggingProgress.current) return;
        updateProgressbar();
    }, [progress, updateProgressbar]);

    function moveProgressThumb(event: MouseEvent) {
        if (!progressSlider.current) return;
        const sliderRect = progressSlider.current.getBoundingClientRect();

        let newLeft = event.clientX - sliderRect.left;

        if (newLeft < 0) {
            newLeft = 0;
        }

        if (newLeft > sliderRect.width) {
            newLeft = sliderRect.width;
        }

        progressSliderThumb.current?.style.setProperty('left', `${newLeft}px`);
        progressSliderProgress.current?.style.setProperty('width', `${newLeft}px`);

        progressLeft.current = newLeft;
    }

    function handleMouseDown(event: React.MouseEvent<HTMLDivElement>) {
        moveProgressThumb(event.nativeEvent);
        isDraggingProgress.current = true;
    }

    function playPause(event: React.MouseEvent<HTMLDivElement>) {
        if (event.target !== event.currentTarget) return;
        if (isPlaying) {
            pause();
        } else {
            resume();
        }
    }

    const coverRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);

    if (!isPlaying) {
        coverRef.current?.classList.add(styles.hover);
        playerRef.current?.classList.add(styles.hover);
    } else if (
        coverRef.current?.classList.contains(styles.hover) ||
        playerRef.current?.classList.contains(styles.hover)
    ) {
        coverRef.current?.classList.remove(styles.hover);
        playerRef.current?.classList.remove(styles.hover);
    }

    // function formatTime(seconds: number) {
    //     const minutes = Math.floor(seconds / 60);
    //     const remainingSeconds = Math.floor(seconds % 60);
    //     const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    //     return minutes + ':' + formattedSeconds;
    // }

    return (
        src && (
            <div className={styles.playerContainer}>
                <div ref={coverRef} className={styles.cover} style={{ backgroundImage: `url(${coverUrl})` }}></div>
                <div ref={playerRef} className={styles.player} onClick={playPause} aria-hidden="true">
                    <button className={styles.closeButton} onClick={stop}></button>
                    <div
                        className={clsx(styles.sliderContainer, styles.progress)}
                        ref={progressSlider}
                        onMouseDown={handleMouseDown}
                        aria-hidden="true"
                    >
                        <div className={styles.sliderTrack}></div>
                        <div className={styles.sliderProgress} ref={progressSliderProgress}></div>
                        <div className={styles.sliderThumb} ref={progressSliderThumb}></div>
                    </div>
                    {isPlaying ? <div className={styles.pauseIcon}></div> : <div className={styles.playIcon}></div>}

                    {/* <div className={styles.playbarRight}>
                <div className={styles.sliders}>
                    <div className={clsx(styles.sliderContainer, styles.progress)} ref={progressSlider}>
                        <div className={styles.sliderTrack}></div>
                        <div className={styles.sliderProgress} ref={progressSliderProgress}></div>
                        <div className={styles.sliderThumb} ref={progressSliderThumb}></div>
                    </div>
                    <div className={styles.time}>
                        {formatTime(currentProgress.data ?? 0)}/{formatTime(currentDuration)}
                    </div>
                    <div className={clsx(styles.sliderContainer, styles.volume)}>
                        <div className={styles.sliderTrack}></div>
                        <div className={styles.sliderProgress}></div>
                        <div className={styles.sliderThumb}></div>
                    </div>
                </div>
            </div> */}
                </div>
            </div>
        )
    );
}
