import { Source, YoutubeApi } from 'search-api-core';

import { Fetcher } from '../modules/track-fetcher';

class YoutubeParser implements MediaParser {

    async parse(url: string, params: string[]): Promise<Track[]> {
        if (params.length < 2 || !['embed', 'watch', 'playlist'].includes(params[0])) {
            throw new Error('Invalid URL');
        }

        if (params[0] === 'playlist') {
            const list = params.pop() as string;

            return Fetcher.YoutubeClient.getPlaylist(list, YoutubeApi.ClientType.YOUTUBE)
                .then(playlist =>
                    playlist.contents.map(video => ({
                        provider: Source.YOUTUBE_MUSIC,
                        id: video.id,
                        title: video.title,
                        href: video.href,
                        thumbnail: video.thumbnails[0].href,
                        artists: [{
                            name: video.channel.name,
                            href: video.channel.href
                        }]
                    }))
                );
        }

        const video_id = params.pop() as string;

        return Fetcher.YoutubeClient.getVideo(video_id)
            .then(video => {
                return [{
                    provider: Source.YOUTUBE_MUSIC,
                    id: video.id,
                    title: video.title,
                    href: video.href,
                    thumbnail: video.thumbnails[0].href,
                    artists: [{
                        name: video.channel.name,
                        href: video.channel.href
                    }]
                }];
            });
    }

}

export default new YoutubeParser();