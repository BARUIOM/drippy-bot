import { MessageEmbed } from 'discord.js'

import commands from '../commands'
import Command from '../modules/command'

const callback: Executor = async (message, channel, member, guild, args) => {
    const embed = new MessageEmbed()
        .setTitle('Available commands:');

    for (const name in commands) {
        let title = global.prefix + name;
        const command = commands[name];

        if (command.args.length) {
            const args = command.args.map(e =>
                `<${e}>`
            ).join(' ');

            title = `${title} ${args}`;
        }

        embed.addField(title, command.description);
    }

    channel.send(embed);
};

export default new Command('Shows a list of available commands', callback);