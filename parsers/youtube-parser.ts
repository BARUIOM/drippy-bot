import qs from 'querystring'

import axios, { AxiosError } from 'axios'
import { Provider } from '../modules/parse-utils'

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
                    provider: Provider.YOUTUBE_MUSIC,
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

        return axios.get('https://www.youtube.com/get_video_info', {
            params: {
                video_id,
                c: 'WEB_EMBEDDED_PLAYER'
            }
        }).then(({ data }) => {
            const { status, player_response } = qs.parse(decodeURIComponent(data));

            if (status === 'fail') {
                throw new Error('Invalid URL');
            }

            const { videoDetails } = JSON.parse(player_response as string);

            return [{
                provider: Provider.YOUTUBE_MUSIC,
                id: videoDetails.videoId,
                title: videoDetails.title,
                href: `https://youtu.be/${videoDetails.videoId}`,
                thumbnail: videoDetails.thumbnail.thumbnails[0].url,
                artists: [{
                    name: videoDetails.author,
                    href: `https://youtube.com/channel/${videoDetails.channelId}`
                }]
            }];
        });
    }

}

export default new YoutubeParser();