import axios from 'axios'
import cheerio from 'cheerio'

class SpotifyParser implements MediaParser {

    async parse(url: string): Promise<Track[]> {
        const tracks: any[] = [];

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const resource = decodeURIComponent($('script#resource').html() as string);
        const meta = JSON.parse(resource);

        switch (meta.type) {
            case 'track':
                tracks.push(meta);
                break;
            case 'playlist':
                meta.tracks.items.map((e: any) => e['track'])
                    .forEach((e: any) => tracks.push(e));
                break;
        }

        return tracks.map(({ id, name: title, external_urls: { spotify: href }, artists }) => ({
            id, title, href,
            artists: artists.map((e: any) =>
                ({ name: e.name, href: e.external_urls.spotify })
            )
        }));
    }

}

export default new SpotifyParser();