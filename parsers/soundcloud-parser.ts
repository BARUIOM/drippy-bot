import axios, { AxiosError } from 'axios'
import cheerio from 'cheerio'

import { Source } from 'search-api-core';

import { Fetcher } from '../modules/track-fetcher';

const _error = (message: string = 'Invalid SoundCloud URL') => new Error(message);

class SoundCloudParser implements MediaParser {

    async parse(url: URL): Promise<Track[]> {
        return axios.get(url.toString()).then(async ({ data }) => {
            const $ = cheerio.load(data);

            const content = $('meta[property="al:ios:url"]')
                .prop('content') as string;

            const values = content.replace(/\//g, '')
                .split(':');

            if (!['sounds', 'playlists'].includes(values[1])) {
                throw _error();
            }

            const id = values.pop() as string;

            if (values[1] === 'playlists') {
                const playlist = await Fetcher.SoundCloudClient.getPlaylist(id);
                const ids = playlist.tracks.map(e => String(e.id));

                const tracks = await Fetcher.SoundCloudClient.getTracks(...ids);
                return ids.map(e => tracks.find(t => String(t.id) === e)!);
            }

            return Promise.all([
                Fetcher.SoundCloudClient.getTrack(id)
            ]);
        }).then((tracks) =>
            tracks.map(track => ({
                provider: Source.SOUNDCLOUD,
                id: String(track.id),
                title: track.title,
                href: track.permalink_url,
                thumbnail: track.artwork_url,
                artists: [{
                    name: track.user.username,
                    href: track.user.permalink_url
                }]
            }))
        ).catch((e: AxiosError) => {
            if (e.response) {
                throw _error();
            }

            throw e;
        });
    }

}

export default new SoundCloudParser();