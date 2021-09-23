import axios, { AxiosError } from 'axios'
import cheerio from 'cheerio'

import { Source } from 'search-api-core';

const cover = (hash: string, size: number = 120) =>
    `https://e-cdns-images.dzcdn.net/images/cover/${hash}/${size}x${size}.jpg`;

const _error = (message: string = 'Invalid Deezer URL') => new Error(message);

const _validPath = (url: URL): boolean => {
    const paths = url.pathname.substr(1)
        .split('/').reverse();

    return ['track', 'album', 'playlist']
        .includes(paths[1]);
}

class DeezerParser implements MediaParser {

    // TODO: Use Deezer rest API instead of web scrapping
    async parse(url: URL): Promise<Track[]> {
        if (!_validPath(url)) {
            throw _error();
        }

        const [media_id, media_type] = url.pathname.substr(1)
            .split('/').reverse();

        return axios.get(`https://deezer.com/${media_type}/${media_id}`)
            .then(({ data }) => {
                const $ = cheerio.load(data);

                const script = $('#naboo_content script')
                    .last().html() as string;
                const match = /[{].+[}]/gi.exec(script);

                if (match !== null && match[0]) {
                    const meta = JSON.parse(match[0]);

                    switch (media_type) {
                        case 'track':
                            return [meta.DATA];
                        case 'album':
                        case 'playlist':
                            return meta.SONGS['data'] as any[];
                    }
                }

                return [];
            })
            .then(tracks =>
                tracks.map(track => ({
                    provider: Source.DEEZER,
                    id: track['SNG_ID'],
                    title: track['SNG_TITLE'],
                    href: `https://deezer.com/track/${track['SNG_ID']}`,
                    thumbnail: cover(track['ALB_PICTURE']),
                    artists: track['ARTISTS'].map((e: any) => ({
                        name: e.ART_NAME,
                        href: `https://deezer.com/artist/${e.ART_ID}`
                    }))
                }))
            )
            .catch((e: AxiosError) => {
                if (e.response) {
                    throw _error();
                }

                throw e;
            });
    }

}

export default new DeezerParser();