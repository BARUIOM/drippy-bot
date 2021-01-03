import Player from '../modules/player'
import Command from '../modules/command'
import { ParseUtils } from '../modules/parse-utils'

const callback: Executor = async (message, channel, member, guild, args) => {
    if (!member.voice.channel) {
        throw new Error("You're not connected to a voice channel!");
    }

    if (args.length === 1) {
        throw new Error('You have to provide an URL to play');
    }

    const tracks = await ParseUtils.parse(args[1]);
    if (tracks === undefined || !tracks.length) {
        throw new Error("Sorry, but I can't play that");
    }

    const player = await (async () => {
        if (!Player.has(guild) && member.voice.channel) {
            const connection = await member.voice.channel.join();
            await connection.voice?.setSelfDeaf(true);

            return new Player(guild, connection, channel);
        }

        return Player.get(guild);
    })();

    if (player.playback) {
        player.play(tracks.shift() as Track);
    }

    if (tracks.length) {
        player.add(...tracks);
    }
};

export default new Command('Play a song from a valid URL', callback, 'url');