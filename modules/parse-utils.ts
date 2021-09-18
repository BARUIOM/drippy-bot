import qs from 'querystring'

import SoundCloudParser from '../parsers/soundcloud-parser'
import SpotifyParser from '../parsers/spotify-parser'
import YoutubeParser from '../parsers/youtube-parser'
import DeezerParser from '../parsers/deezer-parser'

export class ParseUtils {

    public static async parse(href: string): Promise<Track[] | undefined> {
        href = href.replace(/www[.]/gi, '');

        if (!/^(?:http[s]?:\/\/)/gi.test(href)) {
            href = `https://${href}`;
        }

        const url = new URL(href);
        const params = url.pathname.split('/')
            .filter(e => e.length);

        switch (url.host.toLowerCase()) {
            case 'youtu.be':
                params.unshift('embed');
            case 'youtube.com':
            case 'music.youtube.com':
                if (params[0] === 'embed' && params[1] === 'playlist') {
                    params.shift();
                }

                if (['watch', 'playlist'].includes(params[0])) {
                    const { v, list } = qs.parse(url.search.substr(1));
                    params.push((v || list) as string);
                }

                return YoutubeParser.parse(href, params);
            case 'open.spotify.com':
                href = `https://open.spotify.com/embed/${params.join('/')}`;
                return SpotifyParser.parse(href, params);
            case 'deezer.com':
                return DeezerParser.parse(href, params);
            case 'soundcloud.com':
                return SoundCloudParser.parse(href);
        }
    }

}