import { Source, YoutubeApi } from 'search-api-core';

import { Fetcher } from '../modules/track-fetcher';

const _error = (message: string = 'Invalid Youtube URL') => new Error(message);

const _validPath = (url: URL): boolean =>
    (url.hostname === 'youtu.be' && !!url.pathname.substr(1)) || ['embed', 'watch', 'playlist']
        .some(e => url.pathname.startsWith('/' + e));

class YoutubeParser implements MediaParser {

    async parse(url: URL): Promise<Track[]> {
        if (!_validPath(url)) {
            throw _error();
        }

        if (url.pathname.startsWith('/playlist')) {
            const list = url.searchParams.get('list');

            if (!list)
                throw _error();

            if (url.hostname.startsWith('music')) {
                return Fetcher.YoutubeClient.getPlaylist(
                    list, YoutubeApi.ClientType.YOUTUBE_MUSIC
                ).then(playlist =>
                    playlist.contents.map(music => ({
                        provider: Source.YOUTUBE_MUSIC,
                        id: music.id,
                        title: music.title,
                        href: music.href,
                        thumbnail: music.thumbnails[0].href,
                        artists: music.artists
                    }))
                );
            }

            return Fetcher.YoutubeClient.getPlaylist(
                list, YoutubeApi.ClientType.YOUTUBE
            ).then(playlist =>
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

        if (url.hostname === 'youtu.be') {
            url.searchParams.set('v', url.pathname.substr(1));
        }

        const video_id = url.searchParams.get('v');

        if (!video_id)
            throw _error();

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