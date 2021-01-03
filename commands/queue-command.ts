import { MessageEmbed } from 'discord.js'

import Player from '../modules/player'
import Command from '../modules/command'

const stringify = (track: Track) => `[${track.title}](${track.href})`;

const callback: Executor = async (message, channel, member, guild, args) => {
    const player = Player.get(guild);

    if (!Player.has(guild) || (!player.queue.length && !player.current)) {
        throw new Error('The queue is empty!');
    }

    const embed = new MessageEmbed();
    embed.setTitle(`${guild.name}'s queue:`);

    if (player.queue.length) {
        embed.setFooter(`${player.queue.length} track`);

        if (player.queue.length > 1) {
            embed.setFooter(embed.footer?.text + 's');
        }
    }

    if (player.current) {
        embed.setThumbnail(player.current.thumbnail);
        embed.addField('Now playing:', stringify(player.current), true);
        embed.addField('\u200B', '\u200B', true);
    }

    const queue = player.queue.slice(0, 10);

    if (queue.length) {
        embed.addField('Next track:', stringify(queue[0]), true);

        const description = queue.slice(1).reduce((e, track, i) => {
            return e += '**•**\t' + stringify(track) + '\n';
        }, '');

        if (description && description.length) {
            embed.addField('Upcoming tracks:', description);
        }
    }

    channel.send(embed);
};

export default new Command("Displays a list of the server's current queue", callback);