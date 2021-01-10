import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild) || !player.queue.length) {
        throw new Error('The queue is empty!');
    }

    if (!player.contains(member)) {
        throw new Error("You're either not connected to a voice channel or it's not the same as me!");
    }

    message.react('\u2705');
    return player.shuffle();
};

export default new Command('Shuffles the server queue', callback);