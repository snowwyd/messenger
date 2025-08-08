export const spotifyEntityTypes = ['track', 'playlist', 'album', 'episode'] as const;

export type SpotifyEntityType = (typeof spotifyEntityTypes)[number];
