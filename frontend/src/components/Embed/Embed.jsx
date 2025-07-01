import { useState } from 'react';

import styles from './Embed.module.css';

export default function WrappedEmbed({ url, isSingleImageLink, index }) {
    const [hasEmbed, setHasEmbed] = useState(true);
    const marginTop = index === 0 ? styles.marginTop : '';

    return (
        <div className={hasEmbed && !isSingleImageLink ? marginTop : ''}>
            <Embed url={url} setHasEmbed={setHasEmbed} />
        </div>
    );
}

function Embed({ url, setHasEmbed }) {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (
        parsedUrl.hostname.includes('soundcloud.com') &&
        pathParts.length > 1 &&
        pathParts[0] !== 'discover' &&
        pathParts[0] !== 'you'
    ) {
        return <SoundCloud url={url} />;
    }

    if (
        parsedUrl.hostname.includes('spotify.com') &&
        ['track', 'playlist', 'album'].some((substr) => pathParts[0].includes(substr))
    ) {
        return <Spotify type={pathParts[0]} id={pathParts[1]} />;
    }

    if (url.includes('youtube.com/watch?v=')) {
        const videoId = new URL(url).searchParams.get('v');
        return (
            <iframe
                className={`${styles.embed} ${styles.youtube}`}
                width="560"
                height="315"
                loading="lazy"
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            ></iframe>
        );
    }
    if (url.includes('youtu.be/')) {
        const parsed = new URL(url);
        return (
            <iframe
                className={`${styles.embed} ${styles.youtube}`}
                width="560"
                height="315"
                loading="lazy"
                src={`https://www.youtube.com/embed/${parsed.pathname.slice(1)}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
            ></iframe>
        );
    }

    if (isImageUrl(url)) {
        return (
            <a href={url} className={styles.picture} target="_blank" rel="noopener noreferrer">
                <img src={url} />
            </a>
        );
    }

    setHasEmbed(false);
    return null;
}

function isImageUrl(url) {
    return /\.(gif|jpe?g|png|webp)$/i.test(url);
}

function SoundCloud({ url }) {
    const showUser = true;
    const hexColor = '5353c6';
    return (
        <div className={`${styles.soundcloudWrapperRectangle} ${styles.embed}`}>
            <iframe
                className={styles.soundcloud}
                height="191"
                width="500"
                loading="lazy"
                frameBorder="0"
                src={`https://w.soundcloud.com/player/?url=${url}&color=%23${hexColor}&auto_play=false&hide_related=true&show_comments=false&show_user=${showUser}&show_reposts=false&show_teaser=false&visual=true`}
            ></iframe>
        </div>
    );
}

function Spotify({ type, id }) {
    if (type === 'track') {
        return (
            <iframe
                className={styles.embed}
                src={`https://open.spotify.com/embed/${type}/${id}`}
                frameBorder="0"
                height="152"
                width="510"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
        );
    }
    if (type === 'playlist' || type === 'album') {
        return (
            <iframe
                className={styles.embed}
                src={`https://open.spotify.com/embed/${type}/${id}`}
                frameBorder="0"
                height="452"
                width="510"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
        );
    }
}
