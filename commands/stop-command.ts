import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild)) {
        throw new Error("I'm not playing anything right now");
    }

    if (!player.contains(member)) {
        throw new Error("You're either not connected to a voice channel or it's not the same as me!");
    }

    return player.stop();
};

export default new Command('Stops the current playback, leaves the voice channel and clears the server queue', callback);