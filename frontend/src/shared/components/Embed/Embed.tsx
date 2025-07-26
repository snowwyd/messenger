import { createContext, use, useRef, useState } from 'react';

import { hslToHex } from '@/utils/color';
import { isImage } from '@/utils/url';

import styles from './Embed.module.css';

interface WrappedEmbedProps {
    url: string;
    index: number;
}

interface EmbedUrlProps {
    url: string;
}

type SpotifyTypes = 'track' | 'playlist' | 'album';

interface SpotifyProps {
    type: SpotifyTypes;
    id: string;
}

interface LazyIframeProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
    className: string;
    src: string;
    title: string;
    width: number;
    height: number;
}

const EmbedContext = createContext('');

export default function WrappedEmbed({ url, index }: WrappedEmbedProps) {
    const marginTop = index === 0 ? styles.marginTop : '';

    return (
        <EmbedContext value={marginTop}>
            <Embed url={url} />
        </EmbedContext>
    );
}

function Embed({ url }: EmbedUrlProps) {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (
        parsedUrl.hostname.startsWith('soundcloud.com') &&
        pathParts.length > 1 &&
        pathParts[0] !== 'discover' &&
        pathParts[0] !== 'you'
    ) {
        return <SoundCloud url={url} />;
    }

    if (parsedUrl.hostname.startsWith('open.spotify.com') && ['track', 'playlist', 'album'].includes(pathParts[0])) {
        return <Spotify type={pathParts[0] as SpotifyTypes} id={pathParts[1]} />;
    }

    if (
        parsedUrl.pathname === '/watch' &&
        parsedUrl.searchParams.get('v') &&
        (parsedUrl.hostname.startsWith('youtube.com') || parsedUrl.hostname.endsWith('.youtube.com'))
    ) {
        return <YouTube url={url} />;
    }

    if (isImage(url)) {
        return <ImagePreview url={url} />;
    }

    return null;
}

function Spotify({ type, id }: SpotifyProps) {
    if (type === 'track') {
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`}
                title="Spotify player"
                width={350}
                height={80}
                referrerPolicy="strict-origin-when-cross-origin"
            />
        );
    }
    if (type === 'playlist' || type === 'album') {
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://open.spotify.com/embed/${type}/${id}`}
                title="Spotify player"
                width={400}
                height={152}
                referrerPolicy="strict-origin-when-cross-origin"
            />
        );
    }
}

function SoundCloud({ url }: EmbedUrlProps) {
    const marginTop = use(EmbedContext);
    const showUser = true;
    const root = document.documentElement;
    const mainColor = getComputedStyle(root).getPropertyValue('--main-color').trim();
    const hexColor = hslToHex(mainColor);
    return (
        <div className={`${styles.soundcloudWrapper} ${styles.embed} ${marginTop}`}>
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
    const marginTop = use(EmbedContext);

    return (
        <a href={url} className={`${styles.picture} ${marginTop}`} target="_blank" rel="noopener noreferrer">
            <img src={url} loading="lazy" height="200" alt="" />
        </a>
    );
}

function LazyIframe({ className, src, title, width, height, ...rest }: LazyIframeProps) {
    const parsedUrl = new URL(src);
    const isSoundCloud = parsedUrl.hostname.startsWith('w.soundcloud.com');

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const marginTop = use(EmbedContext);
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            ref={iframeRef}
            className={isSoundCloud ? '' : marginTop}
            style={{ height: height, width: width, overflow: 'hidden', position: 'relative' }}
        >
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
