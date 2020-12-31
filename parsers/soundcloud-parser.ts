import axios from 'axios'
import cheerio from 'cheerio'

class SCParser implements MediaParser {

    async parse(url: string): Promise<Track[]> {
        const tracks: any[] = [];

        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const content = $('meta[property="al:ios:url"]')
            .prop('content') as string;

        if (content && content.length) {
            const values = content.replace(/[/]/g, '')
                .split(':');

            const script = $('script').last().html() as string;
            const match = /\[\{.+\](?!.+\1)/gi.exec(script);

            if (match !== null) {
                const meta = JSON.parse(match[0]);

                switch (values[1]) {
                    case 'sounds':
                        const [track] = meta.find((e: any) => e.id === 19).data;
                        tracks.push(track);
                        break;
                    case 'playlists':
                        const [playlist] = meta.find((e: any) => e.id === 47).data;
                        playlist.tracks.forEach((e: any) =>
                            tracks.push(Object.assign(e, { user: playlist.user }))
                        );
                        break;
                }
            }
        }

        return tracks.map(({ id, title, permalink_url: href, artwork_url: thumbnail, user }) => ({
            id, title, href, thumbnail,
            artists: [{
                name: user.username,
                href: user.permalink_url
            }]
        }));
    }

}

export default new SCParser();