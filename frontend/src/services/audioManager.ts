class AudioManager {
    private audio: HTMLAudioElement;
    private onEnded?: () => void;
    private onTimeUpdate?: (time: number) => void;
    private onMetadataLoad?: (time: number) => void;

    constructor() {
        this.audio = new Audio();

        this.audio.addEventListener('ended', () => {
            if (this.onEnded) this.onEnded();
        });

        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) this.onTimeUpdate(this.audio.currentTime);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.onMetadataLoad) this.onMetadataLoad(this.audio.duration);
        });
    }

    play(src: string) {
        this.audio.src = src;
        this.audio.volume = 0.2;
        this.audio.play();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    pause() {
        this.audio.pause();
    }

    resume() {
        if (this.audio.currentTime === this.audio.duration) {
            this.audio.src = `${this.audio.src}`;
        }

        this.audio.play();
    }

    setProgress(time: number) {
        this.audio.currentTime = time;
    }

    setVolume(volume: number) {
        this.audio.volume = volume;
    }

    setOnEnded(callback: () => void) {
        this.onEnded = callback;
    }

    setOnTimeUpdate(callback: (time: number) => void) {
        this.onTimeUpdate = callback;
    }

    setOnMetadataLoad(callback: (duration: number) => void) {
        this.onMetadataLoad = callback;
    }
}

export const audioManager = new AudioManager();
