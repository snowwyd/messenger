import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { hslToHex } from '@/utils/colorUtils';
import { isImage } from '@/utils/urlUtils';

import styles from './Embed.module.css';

const EmbedContext = createContext();

export default function WrappedEmbed({ url, index }) {
    const marginTop = index === 0 ? styles.marginTop : '';

    return (
        <EmbedContext.Provider value={marginTop}>
            <Embed url={url} />
        </EmbedContext.Provider>
    );
}

function Embed({ url }) {
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

    if (
        parsedUrl.hostname.startsWith('open.spotify.com') &&
        ['track', 'playlist', 'album'].some((substr) => pathParts[0].includes(substr))
    ) {
        return <Spotify type={pathParts[0]} id={pathParts[1]} />;
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

function SoundCloud({ url }) {
    const marginTop = useContext(EmbedContext);
    const showUser = true;
    const root = document.documentElement;
    const mainColor = getComputedStyle(root).getPropertyValue('--main-color').trim();
    const hexColor = hslToHex(mainColor);
    return (
        <div className={`${styles.soundcloudWrapper} ${styles.embed} ${marginTop}`}>
            <LazyIframe
                className={styles.soundcloud}
                src={`https://w.soundcloud.com/player/?url=${url}&color=%23${hexColor}&auto_play=false&hide_related=true&show_comments=false&show_user=${showUser}&show_reposts=false&show_teaser=false&visual=true`}
                width={450}
                height={150}
            />
        </div>
    );
}

function Spotify({ type, id }) {
    if (type === 'track') {
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`}
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
                width={400}
                height={152}
                referrerPolicy="strict-origin-when-cross-origin"
            />
        );
    }
}

function YouTube({ url }) {
    if (url.includes('youtube.com/watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        return (
            <LazyIframe
                className={styles.embed}
                src={`https://youtube.com/embed/${videoId}`}
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
                width={560}
                height={315}
                allow="clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            />
        );
    }
}

function ImagePreview({ url }) {
    const marginTop = useContext(EmbedContext);

    return (
        <a href={url} className={`${styles.picture} ${marginTop}`} target="_blank" rel="noopener noreferrer">
            <img src={url} loading="lazy" />
        </a>
    );
}

function LazyIframe({ className, src, width, height, ...rest }) {
    const parsedUrl = new URL(src);
    const isSoundCloud = parsedUrl.hostname.startsWith('w.soundcloud.com');
    const isYouTube = parsedUrl.hostname.includes('youtu');

    const marginTop = useContext(EmbedContext);
    const iframeRef = useRef();
    const [visible, setVisible] = useState(false);
    const [loaded, setLoaded] = useState(isYouTube ? true : false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        });
        if (iframeRef.current) observer.observe(iframeRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={iframeRef}
            className={isSoundCloud ? '' : marginTop}
            style={{ height: height, width: width, overflow: 'hidden', position: 'relative' }}
        >
            {visible && (
                <iframe
                    className={className}
                    src={src}
                    width={width}
                    height={height}
                    loading="lazy"
                    style={{
                        position: loaded ? 'relative' : 'absolute',
                        opacity: loaded ? 1 : 0,
                        visibility: loaded ? 'visible' : 'hidden',
                        transition: '0.2s',
                    }}
                    onLoad={() => setLoaded(true)}
                    {...rest}
                />
            )}
            <div className={styles.plug} />
        </div>
    );
}
