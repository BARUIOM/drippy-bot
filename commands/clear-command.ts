import { MessageEmbed } from 'discord.js'

import Player from '../modules/player'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild) || !player.queue.length) {
        throw new Error('The queue is already empty!');
    }

    if (!player.contains(member)) {
        throw new Error("You're either not connected to a voice channel or it's not the same as me!");
    }

    const embed = new MessageEmbed()
        .setDescription('Queue cleared!');
    channel.send(embed);

    return player.clear();
};

export default new Command('Clears the server queue', callback);