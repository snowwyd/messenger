import { spotifyEntityTypes, type SpotifyEntityType } from '@/shared/types/SpotifyEntityType';

export function isEmbeddableLink(urls: string[]) {
    return urls.some((url) => {
        return isImage(url) || isAudio(url) || isSoundCloud(url) || isSpotify(url) || isYouTube(url);
    });
}

export function isDirectFileLink(url: string) {
    return isImage(url) || isAudio(url);
}

export function isImage(url: string) {
    const pathname = new URL(url).pathname;
    const exts = ['.gif', '.webp', '.png', '.jpg', '.jpeg'];
    return exts.some((ext) => pathname.toLowerCase().endsWith(ext));
}

export function isAudio(url: string) {
    const pathname = new URL(url).pathname;
    const exts = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];
    return exts.some((ext) => pathname.toLowerCase().endsWith(ext));
}

export function isSoundCloud(url: string) {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (
        parsedUrl.hostname.startsWith('soundcloud.com') &&
        pathParts.length > 1 &&
        pathParts[0] !== 'discover' &&
        pathParts[0] !== 'you'
    ) {
        return true;
    }

    return false;
}

export function isSpotify(url: string) {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (
        parsedUrl.hostname.startsWith('open.spotify.com') &&
        spotifyEntityTypes.includes(pathParts[0] as SpotifyEntityType)
    ) {
        return true;
    }

    return false;
}

export function isYouTube(url: string) {
    const parsedUrl = new URL(url);

    if (
        parsedUrl.pathname === '/watch' &&
        parsedUrl.searchParams.get('v') &&
        (parsedUrl.hostname.startsWith('youtube.com') || parsedUrl.hostname.endsWith('.youtube.com'))
    ) {
        return true;
    }

    return false;
}
