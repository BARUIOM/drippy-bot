import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild) || (!player.queue.length && !player.current)) {
        throw new Error("I'm not playing anything!");
    }

    player.pause();
    message.react('\u2705');
};

export default new Command('pause', callback);