import SoundCloudParser from '../parsers/soundcloud-parser'
import SpotifyParser from '../parsers/spotify-parser'
import YoutubeParser from '../parsers/youtube-parser'
import DeezerParser from '../parsers/deezer-parser'

const _parseURL = (uri: string): Promise<URL> =>
    new Promise((resolve, reject) => {
        try {
            resolve(new URL(uri));
        } catch (error: any) {
            if (error.code === 'ERR_INVALID_URL') {
                reject('Invalid URL');
            }

            reject(error.message || error);
        }
    });

export class ParseUtils {

    public static async parse(href: string): Promise<Track[] | undefined> {
        const url = await _parseURL(
            href.replace(/www[.]/gi, '')
        );

        switch (url.hostname.toLowerCase()) {
            case 'youtu.be':
            case 'youtube.com':
            case 'music.youtube.com':
                return YoutubeParser.parse(url);
            case 'open.spotify.com':
                return SpotifyParser.parse(url);
            case 'deezer.com':
                return DeezerParser.parse(url);
            case 'soundcloud.com':
                return SoundCloudParser.parse(url);
        }
    }

}