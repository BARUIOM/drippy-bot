declare interface Track {

    readonly id: string;

    readonly title: string;
    readonly href: string;

    readonly artists: { name: string, href: string }[];

    readonly token?: string;

}

declare interface MediaParser {

    async parse(url: string): Promise<Track[]>;

}