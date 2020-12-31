import SCParser from '../parsers/soundcloud-parser'
import SpotifyParser from '../parsers/spotify-parser'

export enum Provider {

    SPOTIFY, DEEZER, YOUTUBE, SOUNDCLOUD

}

export class ParseUtils {

    public static async parse(href: string): Promise<{ name: Provider, tracks: Track[] } | undefined> {
        if (!/^(?:http[s]?:\/\/)/gi.test(href)) {
            href = `https://${href}`;
        }

        const url = new URL(href);
        const params = url.pathname.split('/')
            .filter(e => e.length);

        switch (url.host.toLowerCase()) {
            case 'open.spotify.com':
                href = `https://open.spotify.com/embed/${params.join('/')}`;

                return {
                    name: Provider.SPOTIFY,
                    tracks: await SpotifyParser.parse(href)
                };
            case 'soundcloud.com':
                return {
                    name: Provider.SOUNDCLOUD,
                    tracks: await SCParser.parse(href)
                };
        }
    }

}