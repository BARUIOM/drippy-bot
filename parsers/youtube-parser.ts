import axios, { AxiosError } from 'axios'
import { Source } from 'search-api-core';

if (!process.env['YOUTUBE_DATA_API_KEY']) {
    throw new Error("The environment variable 'YOUTUBE_DATA_API_KEY' is not set");
}

const API_KEY = process.env['YOUTUBE_DATA_API_KEY'] as string;

class YoutubeParser implements MediaParser {

    async parse(url: string, params: string[]): Promise<Track[]> {
        if (params.length < 2 || !['embed', 'watch', 'playlist'].includes(params[0])) {
            throw new Error('Invalid URL');
        }

        if (params[0] === 'playlist') {
            const list = params.pop();

            return axios.get('https://www.youtube.com/list_ajax', {
                params: {
                    style: 'json',
                    action_get_list: 1,
                    list
                }
            }).then(({ data }) =>
                (data.video as any[]).map(({ user_id, thumbnail, encrypted_id: id, title, author }) => ({
                    provider: Source.YOUTUBE_MUSIC,
                    id, title, href: `https://youtu.be/${id}`,
                    thumbnail,
                    artists: [{
                        name: author,
                        href: `https://youtube.com/channel/UC${user_id}`
                    }]
                }))
            ).catch((e: AxiosError) => {
                if (e.response) {
                    throw new Error('Invalid URL');
                }

                throw e;
            });
        }

        const video_id = params.pop();

        return axios.get('/videos', {
            baseURL: 'https://www.googleapis.com/youtube/v3',
            params: {
                id: video_id,
                part: ['id', 'snippet'].join(),
                key: API_KEY
            }
        }).then(response =>
            response.data['items'][0]
        ).then(data => {
            if (data === undefined) {
                throw new Error('Invalid video');
            }

            const { id, snippet: video } = data;

            return [{
                provider: Source.YOUTUBE_MUSIC,
                id: id,
                title: video.title,
                href: `https://youtu.be/${id}`,
                thumbnail: video.thumbnails['default'].url,
                artists: [{
                    name: video.channelTitle,
                    href: `https://youtube.com/channel/${video.channelId}`
                }]
            }];
        });
    }

}

export default new YoutubeParser();