import { Readable } from 'stream';
import { Guild, GuildMember, MessageEmbed, TextChannel, VoiceConnection } from 'discord.js'

import {
    Deezer as DeezerStream,
    SoundCloud as SoundCloudStream,
    Youtube as YoutubeStream
} from 'stream-api-core';

import { Source, Deezer, ProviderData } from 'search-api-core';

import Database from './mongodb';
import { Fetcher } from './track-fetcher';

const players = new Map<string, Player>();

type CachedTrackData = {
    _id: string,
    providers: {
        [source: string]: {
            uid: string,
            md5?: string,
            version?: string
        }
    }
};

const isDeezerData = (data: ProviderData): data is Deezer.Data => 'md5' in data;

const _fetch = async (track: Track): Promise<Readable> => {
    switch (track.provider) {
        case Source.SPOTIFY:
            const collection = Database.Client.db('baruio')
                .collection<CachedTrackData>('tracks');

            const document = await collection.findOne({ _id: track.id });

            if (document) {
                const name = Object.keys(document.providers)[0];
                const data = document.providers[name];

                switch (name) {
                    case Source[Source.DEEZER]:
                        return DeezerStream.Player.stream({
                            uri: Deezer.generateStreamURI(
                                data.uid,
                                data.md5 as string,
                                data.version as string,
                                Deezer.AudioFormat.MP3_128
                            ),
                            key: Deezer.generateBlowfishKey(data.uid)
                        });
                    case Source[Source.SOUNDCLOUD]:
                        return Fetcher.SoundCloudClient.getTrack(data.uid)
                            .then(track =>
                                Fetcher.SoundCloudClient.getTrackStreamURL(track)
                            )
                            .then(uri => {
                                if (uri) {
                                    return SoundCloudStream.Player.stream({ uri });
                                }

                                throw new Error('Unable to fetch track');
                            });
                    case Source[Source.YOUTUBE_MUSIC]:
                        return YoutubeStream.fetchYoutubeDL()
                            .then(binaryPath =>
                                YoutubeStream.Player.stream({
                                    binaryPath, uri: 'https://youtu.be/' + data.uid
                                })
                            );
                }
            }

            return Fetcher.Repository.find(track.id)
                .then(data => {
                    const { uid } = data;

                    const document: CachedTrackData = {
                        _id: track.id,
                        providers: {
                            [Source[data.source]]: { uid }
                        }
                    };

                    if (isDeezerData(data)) {
                        const { md5, version } = data;

                        Object.assign(
                            document.providers[Source[Source.DEEZER]],
                            { md5, version }
                        );
                    }

                    return collection.insertOne(document)
                        .then(() => data);
                })
                .then(data => {
                    const uri = data.uri as string;

                    switch (data.source) {
                        case Source.DEEZER:
                            const { key } = data as Deezer.Data;

                            return DeezerStream.Player.stream({
                                uri, key: key as string
                            });
                        case Source.SOUNDCLOUD:
                            return SoundCloudStream.Player.stream({ uri });
                        case Source.YOUTUBE_MUSIC:
                            return YoutubeStream.fetchYoutubeDL()
                                .then(binaryPath =>
                                    YoutubeStream.Player.stream({ binaryPath, uri })
                                );
                    }

                    throw new Error('Unable to fetch track');
                });
        case Source.DEEZER:
            return Fetcher.DeezerClient.getTrack(track.id)
                .then(track => ({
                    uri: Deezer.generateStreamURI(
                        track.SNG_ID,
                        track.MD5_ORIGIN,
                        track.MEDIA_VERSION,
                        Deezer.AudioFormat.MP3_128
                    ),
                    key: Deezer.generateBlowfishKey(
                        track.SNG_ID
                    )
                }))
                .then(data =>
                    DeezerStream.Player.stream(data)
                )
        case Source.SOUNDCLOUD:
            return Fetcher.SoundCloudClient.getTrack(track.id)
                .then(track =>
                    Fetcher.SoundCloudClient.getTrackStreamURL(track)
                )
                .then(uri => {
                    if (uri) {
                        return SoundCloudStream.Player.stream({ uri });
                    }

                    throw new Error('Unable to fetch track');
                });
        case Source.YOUTUBE_MUSIC:
            return YoutubeStream.fetchYoutubeDL()
                .then(binaryPath =>
                    YoutubeStream.Player.stream({
                        binaryPath, uri: 'https://youtu.be/' + track.id
                    })
                );
    }
};

export default class Player {

    private readonly guild: Guild;
    private readonly connection: VoiceConnection;
    private readonly channel: TextChannel;

    private readonly _queue: Track[] = [];

    private _current?: Track;

    private timeout!: ReturnType<typeof setTimeout>;

    public constructor(guild: Guild, connection: VoiceConnection, channel: TextChannel) {
        this.guild = guild;
        this.connection = connection;
        this.channel = channel;

        players.set(guild.id, this);
        this.connection.once('disconnect', () =>
            players.delete(this.guild.id)
        );
    }

    public add(...tracks: Track[]): void {
        tracks.forEach(e => this._queue.push(e));
        const embed = new MessageEmbed()
            .setDescription(`Queued ${tracks.length} track`);

        if (tracks.length > 1) {
            embed.setDescription(embed.description + 's');
        }

        this.channel.send(embed);
    }

    public remove(index: number): void {
        this._queue.splice(index, 1);
    }

    private async next(): Promise<void> {
        if (this._queue.length) {
            return this.play(this._queue.shift() as Track);
        }

        this.connection.disconnect();
    }

    public async play(track: Track): Promise<void> {
        this._current = track;

        return _fetch(track)
            .then(stream => {
                this.connection.play(stream)
                    .once('start', () => {
                        const description = track.artists.map(e =>
                            `[${e.name}](${e.href})`
                        ).join(' • ');

                        const embed = new MessageEmbed()
                            .setURL(track.href)
                            .setTitle(track.title)
                            .setThumbnail(track.thumbnail)
                            .setDescription(description);

                        this.channel.send(embed);
                    })
                    .once('finish', () =>
                        this.next()
                    );
            })
            .catch(error => {
                const description = `Error on track [${track.title}](${track.href}) - ${error.message || error}`;
                const embed = new MessageEmbed()
                    .setColor('#ffab00')
                    .setDescription(description);

                this.channel.send(embed);
                return this.next();
            });
    }

    public stop(reason?: string): void {
        this.connection.disconnect();

        if (reason && reason.length) {
            const embed = new MessageEmbed()
                .setDescription(reason);

            this.channel.send(embed);
        }
    }

    public skip(): void {
        this.connection.dispatcher.end();
        const embed = new MessageEmbed()
            .setDescription('Track skipped!');
        this.channel.send(embed);
    }

    public pause(): void {
        const dispatcher = this.connection.dispatcher;
        if (dispatcher.paused) {
            throw new Error("I'm already paused!");
        }

        return dispatcher.pause();
    }

    public resume(): void {
        const dispatcher = this.connection.dispatcher;
        if (!dispatcher.paused) {
            throw new Error("I'm currently not paused!");
        }

        return dispatcher.resume();
    }

    public contains(member: GuildMember): boolean {
        return member.voice.channel !== null && member.voice.channel.id === this.connection.channel.id;
    }

    public clear(): void {
        this._queue.length = 0;
    }

    public active(): void {
        clearTimeout(this.timeout);
    }

    public inactive(): void {
        this.timeout = setTimeout(() => {
            this.stop('Disconnected due to inactivity');
        }, 15 * 60 * 1000);
    }

    public shuffle(): void {
        const shuffled = this._queue.map(a =>
            ({ sort: Math.random(), value: a })
        ).sort((a, b) =>
            a.sort - b.sort
        ).map(a => a.value);

        this.clear();
        shuffled.forEach(e =>
            this._queue.push(e)
        );
    }

    public get paused(): boolean {
        return this.connection.dispatcher.paused;
    }

    public get current(): Track | undefined {
        return this._current;
    }

    public get queue(): Track[] {
        return [...this._queue];
    }

    public static get(guild: Guild): Player {
        return players.get(guild.id) as Player;
    }

    public static has(guild: Guild): boolean {
        return players.has(guild.id);
    }

}