import { parseBlob, IAudioMetadata, selectCover } from 'music-metadata';

import { useAudioStore } from '@/shared/hooks/useAudioStore';

import styles from './AudioPreview.module.css';
import { useQuery } from '@tanstack/react-query';

interface AudioPreviewProps {
    url: string;
}

async function getMetadata(url: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const data: IAudioMetadata & { common: { cover?: string } } = await parseBlob(blob);

    const cover = selectCover(data.common.picture);
    if (cover) {
        const image = new Blob([cover.data], { type: cover.format });
        const url = URL.createObjectURL(image);
        data.common.cover = url;
    }

    return data.common;
}

export default function AudioPreview({ url }: AudioPreviewProps) {
    const { play, pause, resume, setCoverUrl, isPlaying, src } = useAudioStore();

    const audioMetadata = useQuery({
        queryKey: ['audioMetadata', url],
        queryFn: () => getMetadata(url),
        gcTime: 60 * 60000,
        staleTime: 60 * 60000,
    });

    function playPause() {
        if (src === null || src !== url) {
            play(url);
            if (audioMetadata.data?.cover) {
                setCoverUrl(audioMetadata.data.cover);
            }
        } else {
            if (isPlaying) {
                pause();
            } else {
                resume();
            }
        }
    }

    return (
        <div className={styles.song}>
            <button
                className={styles.cover}
                style={{ backgroundImage: `url(${audioMetadata.data?.cover})` }}
                onClick={playPause}
            ></button>
            <div className={styles.songInfo}>
                <div className={styles.songName}>{audioMetadata.data?.title}</div>
                <div className={styles.songArtists}>{audioMetadata.data?.artists?.join(', ')}</div>
            </div>
        </div>
    );
}
