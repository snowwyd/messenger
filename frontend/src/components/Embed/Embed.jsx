import { createContext, useContext, useEffect, useRef, useState } from 'react';

import styles from './Embed.module.css';

const EmbedContext = createContext();

function isImageUrl(url) {
    return /\.(gif|jpe?g|png|webp)$/i.test(url);
}

export default function WrappedEmbed({ url, isSingleImageLink, index }) {
    const marginTop = index === 0 && !isSingleImageLink ? styles.marginTop : '';

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

    if (isImageUrl(url)) {
        return <Image url={url} />;
    }

    return null;
}

function SoundCloud({ url }) {
    const marginTop = useContext(EmbedContext);
    const showUser = true;
    const hexColor = '5353c6';
    return (
        <div className={`${styles.soundcloudWrapper} ${styles.embed} ${marginTop}`}>
            <LazyIframe
                timeout={400}
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
                timeout={100}
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
                timeout={100}
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

function Image({ url }) {
    const marginTop = useContext(EmbedContext);
    return (
        <a href={url} className={`${styles.picture} ${marginTop}`} target="_blank" rel="noopener noreferrer">
            <img src={url} loading="lazy" />
        </a>
    );
}

function LazyIframe({ timeout = 0, className, src, width, height, ...rest }) {
    const marginTop = useContext(EmbedContext);
    const ref = useRef();
    const [visible, setVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const parsedUrl = new URL(src);
    const isSoundCloud = parsedUrl.hostname.startsWith('w.soundcloud.com');

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    function onLoad() {
        setTimeout(() => {
            setLoaded(true);
        }, timeout);
    }

    return (
        <div
            ref={ref}
            className={isSoundCloud ? '' : marginTop}
            style={{ minHeight: height, overflow: 'hidden', borderRadius: '1px' }}
        >
            {visible ? (
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
                        transition: '0.3s',
                    }}
                    onLoad={onLoad}
                    {...rest}
                />
            ) : (
                <div style={{ height: height }} />
            )}
        </div>
    );
}
