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

declare type Executor = (client: import('discord.js').Client, message: import('discord.js').Message, args: string[]) => void;