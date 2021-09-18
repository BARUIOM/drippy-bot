import axios, { AxiosError } from 'axios'
import cheerio from 'cheerio'

import { SoundCloud, Source } from 'search-api-core';

const client = new SoundCloud.Api();
client.setTokenRenewalCallback(SoundCloud.generateClientToken);

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

            const id = values.pop() as string;

            if (values[1] === 'playlists') {
                const playlist = await client.getPlaylist(id);
                const ids = playlist.tracks.map(e => String(e.id));

                const tracks = await client.getTracks(...ids);
                return ids.map(e => tracks.find(t => String(t.id) === e));
            }

            return Promise.all([client.getTrack(id)]);
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