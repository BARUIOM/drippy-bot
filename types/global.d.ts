declare interface Track {

    readonly provider: import('../modules/parse-utils').Provider;

    readonly id: string;

    readonly title: string;
    readonly href: string;

    readonly thumbnail: string;
    readonly artists: { name: string, href: string }[];

}

declare interface MediaParser {

    async parse(url: string, params?: string[]): Promise<Track[]>;

}

declare type Executor = (
    message: import('discord.js').Message,
    channel: import('discord.js').TextChannel,
    member: import('discord.js').GuildMember,
    guild: import('discord.js').Guild,
    args: string[]
) => Promise<void> | void;

declare module NodeJS {

    export interface Global {
        readonly prefix: string;
    }

}