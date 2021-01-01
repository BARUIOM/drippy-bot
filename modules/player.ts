import http from 'http'
import { Guild, MessageEmbed, TextChannel, VoiceConnection } from 'discord.js'

import { Provider } from './parse-utils'
import Drippy from '../modules/drippy-api'

const players = new Map<string, Player>();

export default class Player {

    private readonly guild: Guild;
    private readonly connection: VoiceConnection;
    private readonly channel: TextChannel;

    private readonly _queue: Track[] = [];

    private _playback: boolean = true;

    public constructor(guild: Guild, connection: VoiceConnection, channel: TextChannel) {
        this.guild = guild;
        this.connection = connection;
        this.channel = channel;

        players.set(guild.id, this);
    }

    public add(...tracks: Track[]): void {
        tracks.forEach(e => this._queue.push(e));
    }

    public remove(index: number): void {
        this._queue.splice(index, 1);
    }

    public get playback(): boolean {
        return this._playback;
    }

    public async play(track: Track): Promise<void> {
        this._playback = false;
        const token = await Drippy.stream(Provider[track.provider], track.id);

        http.get(`http://localhost:4770/${token}`)
            .once('response', response =>
                this.connection.play(response)
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
                    .once('finish', () => {
                        if (this._queue.length) {
                            return this.play(this._queue.shift() as Track);
                        }

                        this.connection.disconnect();
                        players.delete(this.guild.id);
                    })
            );
    }

    public skip(): void {
        this.connection.dispatcher.end();
        this.channel.send('Track skipped!');
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