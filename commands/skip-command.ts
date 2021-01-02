import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    if (!member.voice.channel) {
        throw new Error("You're not connected to a voice channel!");
    }

    if (!Player.has(guild)) {
        throw new Error("I'm not playing anything right now");
    }

    Player.get(guild).skip();
};

export default new Command('skip', callback);