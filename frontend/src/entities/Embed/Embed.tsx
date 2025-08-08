import { useRef, useState } from 'react';
import clsx from 'clsx';

import { hslToHex } from '@/shared/utils/color';
import { isAudio, isImage, isSoundCloud, isSpotify, isYouTube } from '@/shared/utils/url';
import type { SpotifyEntityType } from '@/shared/types/SpotifyEntityType';
import AudioPreview from '@/entities/Embed/AudioPreview/AudioPreview';

import styles from './Embed.module.css';

interface EmbedUrlProps {
    url: string;
}

interface LazyIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
    className: string;
    src: string;
    title: string;
    width: number;
    height: number;
}

export default function Embed({ url }: EmbedUrlProps) {
    if (isSoundCloud(url)) {
        return <SoundCloud url={url} />;
    }

    if (isSpotify(url)) {
        return <Spotify url={url} />;
    }

    if (isYouTube(url)) {
        return <YouTube url={url} />;
    }

    if (isImage(url)) {
        return <ImagePreview url={url} />;
    }

    if (isAudio(url)) {
        return <AudioPreview url={url} />;
    }
}

function Spotify({ url }: EmbedUrlProps) {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const type = pathParts[0] as SpotifyEntityType;
    const id = pathParts[1];

    const sizeMap = {
        track: { width: 350, height: 80 },
        episode: { width: 350, height: 80 },
        playlist: { width: 400, height: 152 },
        album: { width: 400, height: 152 },
    } as const;

    const size = sizeMap[type];

    return (
        <LazyIframe
            className={styles.embed}
            src={`https://open.spotify.com/embed/${type}/${id}`}
            title="Spotify player"
            width={size.width}
            height={size.height}
            referrerPolicy="strict-origin-when-cross-origin"
        />
    );
}

function SoundCloud({ url }: EmbedUrlProps) {
    const showUser = true;
    const root = document.documentElement;
    const mainColor = getComputedStyle(root).getPropertyValue('--main-color').trim();
    const hexColor = hslToHex(mainColor);
    return (
        <div className={clsx(styles.soundcloudWrapper, styles.embed)}>
            <LazyIframe
                className={styles.soundcloud}
                src={`https://w.soundcloud.com/player/?url=${url}&color=%23${hexColor}&auto_play=false&hide_related=true&show_comments=false&show_user=${showUser}&show_reposts=false&show_teaser=false&visual=true`}
                title="SoundCloud player"
                width={450}
                height={150}
            />
        </div>
    );
}

function YouTube({ url }: EmbedUrlProps) {
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://youtube.com/embed/${videoId}`}
                title="YouTube video player"
                width={560}
                height={315}
                allow="clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        );
    }

    if (url.includes('youtu.be/')) {
        const parsed = new URL(url);
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://youtube.com/embed/${parsed.pathname.slice(1)}`}
                title="YouTube video player"
                width={560}
                height={315}
                allow="clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        );
    }
}

function ImagePreview({ url }: EmbedUrlProps) {
    return (
        <a href={url} className={styles.picture} target="_blank" rel="noopener noreferrer">
            <img src={url} loading="lazy" height="200" alt="" />
        </a>
    );
}

function LazyIframe({ className, src, title, width, height, ...rest }: LazyIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [loaded, setLoaded] = useState(false);

    return (
        <div ref={iframeRef} style={{ height: height, width: width, overflow: 'hidden', position: 'relative' }}>
            <iframe
                title={title}
                className={className}
                src={src}
                width={width}
                height={height}
                loading="lazy"
                style={{
                    position: loaded ? 'relative' : 'absolute',
                    opacity: loaded ? 1 : 0,
                    visibility: loaded ? 'visible' : 'hidden',
                    transition: '0.3s',
                }}
                onLoad={() => setLoaded(true)}
                {...rest}
            />
            <div className={styles.plug} />
        </div>
    );
}
