import dotenv from 'dotenv'
dotenv.config();

import { Client, TextChannel, MessageEmbed } from 'discord.js'
const client = new Client();

import commands from './commands'
import Player from './modules/player'
import Database from './modules/mongodb';
import { Fetcher } from './modules/track-fetcher';

Object.assign(global, { prefix: '$' });

client.once('ready', () => {
    console.log('Bot is active');

    client.on('message', message => {
        if (message.channel.type === 'text' && !message.author.bot && message.content.startsWith(global.prefix)) {
            const command = message.content.substr(1);
            const args = command.split(/\s+/g)
                .filter(e => e.length);

            args[0] = args[0].toLowerCase();

            if (args[0] in commands) {
                const call = commands[args[0]].executor(
                    message, message.channel as TextChannel, message.member!, message.guild!, args
                );

                if (call instanceof Promise) {
                    call.catch((error: Error) => {
                        const embed = new MessageEmbed()
                            .setColor('#d50000')
                            .setDescription(error.message);
                        message.channel.send(embed);
                    });
                }
            }
        }
    });

    client.on('voiceStateUpdate', (a, b) => {
        if (Player.has(a.guild) && a.member?.user.id !== client.user?.id) {
            const player = Player.get(a.guild);

            if (!player.paused) {
                const channel = (a.channel || b.channel)!;

                if (!channel.members.find(e => !e.user.bot)) {
                    return player.inactive();
                }

                return player.active();
            }
        }
    });
});

Database.connect().then(async () => {
    await Fetcher.connect();
    await client.login(process.env['DISCORD_TOKEN']);
});
