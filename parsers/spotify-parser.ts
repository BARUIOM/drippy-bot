import { capitalize } from 'lodash';
import { Source } from 'search-api-core';

import { Fetcher } from '../modules/track-fetcher';

const _error = (message: string = 'Invalid Spotify URL') => new Error(message);

const _validPath = (url: URL): boolean =>
    ['track', 'album', 'playlist']
        .some(e => url.pathname.startsWith('/' + e));

const _fetch = (id: string, type: string): Promise<SpotifyApi.TrackObjectFull[]> => {
    switch (type) {
        case 'track':
            return Fetcher.SpotifyClient.getTrack(id)
                .then(track => [track]);
        case 'album':
            return Fetcher.SpotifyClient.getAlbum(id)
                .then(({ tracks, ...album }) => tracks.items.map(e =>
                    ({ album, external_ids: {}, popularity: 0, ...e })
                ));
        case 'playlist':
            return Fetcher.SpotifyClient.getPlaylist(id)
                .then(playlist => playlist.tracks.items.map(e => e.track));
    }

    return Promise.resolve([]);
}

class SpotifyParser implements MediaParser {

    async parse(url: URL): Promise<Track[]> {
        if (!_validPath(url))
            throw _error();

        const [type, id] = url.pathname.substr(1).split('/');

        if (!id)
            throw _error();

        return _fetch(id, type).then(tracks =>
            tracks.map(track => ({
                provider: Source.SPOTIFY,
                id: track.id,
                title: track.name,
                href: track.external_urls.spotify,
                thumbnail: track.album.images[1].url,
                artists: track.artists.map(e => ({
                    name: e.name,
                    href: e.external_urls.spotify
                }))
            }))
        ).catch((e) => {
            if (e.response && e.response.status === 404) {
                throw _error(capitalize(type) + ' not found');
            }

            throw _error();
        });
    }

}

export default new SpotifyParser();