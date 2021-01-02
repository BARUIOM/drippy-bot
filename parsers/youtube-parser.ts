import qs from 'querystring'

import axios from 'axios'
import { Provider } from '../modules/parse-utils'

class YoutubeParser implements MediaParser {

    async parse(url: string, params?: string[]): Promise<Track[]> {
        if (!params || !params.length) {
            return [];
        }

        if (params[0] === 'playlist') {
            const { search } = new URL(url);
            const { list } = qs.parse(search.substr(1));

            const { data } = await axios.get('https://www.youtube.com/list_ajax', {
                params: {
                    style: 'json',
                    action_get_list: 1,
                    list
                }
            });

            return (data.video as any[]).map(({ user_id, thumbnail, encrypted_id: id, title, author }) => ({
                provider: Provider.YOUTUBE_MUSIC,
                id, title, href: `https://youtu.be/${id}`,
                thumbnail,
                artists: [{
                    name: author,
                    href: `https://youtube.com/channel/UC${user_id}`
                }]
            }));
        }

        const video_id = params.pop();
        const { data } = await axios.get('https://www.youtube.com/get_video_info', {
            params: {
                video_id,
                c: 'WEB_EMBEDDED_PLAYER'
            }
        });

        const { player_response } = qs.parse(decodeURIComponent(data));
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
    }

}

export default new YoutubeParser();