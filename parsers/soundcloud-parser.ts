import axios, { AxiosError } from 'axios'
import cheerio from 'cheerio'

import SoundCloud from '@drippy-music/soundcloud-api'
import { Source } from 'search-api-core';

class SoundCloudParser implements MediaParser {

    async parse(url: string): Promise<Track[]> {
        return axios.get(url).then(async ({ data }) => {
            const $ = cheerio.load(data);

            const content = $('meta[property="al:ios:url"]')
                .prop('content') as string;

            const values = content.replace(/\//g, '')
                .split(':');

            if (!['sounds', 'playlists'].includes(values[1])) {
                throw new Error('Invalid URL');
            }

            const src = $('script[src]')
                .last().prop('src');
            const client_id = await axios.get(src).then(({ data }) => {
                const matches = /client_id:"(.+?)"/gi.exec(data);

                if (matches !== null && matches[1]) {
                    return matches[1];
                }
            });

            if (client_id && client_id.length) {
                const id = values.pop() as string;
                const wrapper = new SoundCloud(client_id);

                if (values[1] === 'playlists') {
                    const playlist = await wrapper.getPlaylist(id);
                    const ids = (playlist.tracks as any[]).map(e => e.id);

                    const tracks = await wrapper.getTracks(...ids);
                    return ids.map(e => tracks.find(t => t.id === e));
                }

                return wrapper.getTracks(id);
            }

            return [];
        }).then((tracks: any[]) =>
            tracks.map(({ id, title, permalink_url: href, artwork_url: thumbnail, user }) => ({
                provider: Source.SOUNDCLOUD,
                id, title, href, thumbnail,
                artists: [{
                    name: user.username,
                    href: user.permalink_url
                }]
            }))
        ).catch((e: AxiosError) => {
            if (e.response) {
                throw new Error('Invalid URL');
            }

            throw e;
        });
    }

}

export default new SoundCloudParser();