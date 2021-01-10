import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild) || (!player.queue.length && !player.current)) {
        throw new Error("I'm not playing anything right now");
    }

    if (!player.contains(member)) {
        throw new Error("You're either not connected to a voice channel or it's not the same as me!");
    }

    player.pause();
    message.react('\u2705');
    return player.inactive();
};

export default new Command('Pauses the current playback', callback);