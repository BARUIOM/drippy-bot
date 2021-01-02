import axios, { AxiosError } from 'axios'
import cheerio from 'cheerio'

import { Provider } from '../modules/parse-utils'

class SpotifyParser implements MediaParser {

    async parse(url: string, params: string[]): Promise<Track[]> {
        const tracks: any[] = [];

        if (params.length < 2 || !['track', 'album', 'playlist'].includes(params[0])) {
            throw new Error('Invalid URL');
        }

        return axios.get(url).then(({ data }) => {
            const $ = cheerio.load(data);

            const resource = decodeURIComponent($('script#resource').html() as string);
            const meta = JSON.parse(resource);

            switch (meta.type) {
                case 'track':
                    tracks.push(meta);
                    break;
                case 'album':
                    const data = [...meta.tracks.items];
                    delete meta.tracks;

                    data.map((e: any) => Object.assign(e, { album: meta }))
                        .forEach((e: any) => tracks.push(e));
                    break;
                case 'playlist':
                    meta.tracks.items.map((e: any) => e['track'])
                        .forEach((e: any) => tracks.push(e));
                    break;
            }

            return tracks.map(({ id, name: title, external_urls: { spotify: href }, album: { images }, artists }) => ({
                provider: Provider.SPOTIFY,
                id, title, href,
                thumbnail: images[1].url,
                artists: artists.map((e: any) =>
                    ({ name: e.name, href: e.external_urls.spotify })
                )
            }));
        }).catch((e: AxiosError) => {
            if (e.response) {
                throw new Error('Invalid URL');
            }

            throw e;
        });
    }

}

export default new SpotifyParser();