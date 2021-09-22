import {
    Deezer,
    DeezerApi,
    SoundCloud,
    SoundCloudApi,
    Youtube,
    YoutubeApi,
    Spotify,
    ProviderRepository,
} from 'search-api-core';

import { Youtube as YoutubeStream } from 'stream-api-core';

if (!process.env['DEEZER_ARL_TOKEN']) {
    throw new Error("The environment variable 'DEEZER_ARL_TOKEN' is not set");
}

if (!process.env['YOUTUBE_INNERTUBE_API_KEY']) {
    throw new Error("The environment variable 'YOUTUBEMUSIC_API_KEY' is not set");
}

export namespace Fetcher {

    export const SpotifyClient = new Spotify.Client();

    export const DeezerClient = new DeezerApi.Client(
        process.env['DEEZER_ARL_TOKEN'] as string
    );

    export const SoundCloudClient = new SoundCloudApi.Client();

    export const YoutubeClient = new YoutubeApi.Client(
        process.env['YOUTUBE_INNERTUBE_API_KEY'] as string
    );

    export const Repository = new ProviderRepository(
        SpotifyClient,
        new Deezer.Provider(DeezerClient),
        new SoundCloud.Provider(SoundCloudClient),
        new Youtube.Provider(YoutubeClient)
    );

    export const connect = async (): Promise<void> => {
        await DeezerClient.login();
        SoundCloudClient.setTokenRenewalCallback(SoundCloud.generateClientToken);
        await YoutubeStream.fetchYoutubeDL();
    }

}
