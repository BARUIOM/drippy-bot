import { Client, Message } from 'discord.js'

type Executor = (client: Client, message: Message, args: string[]) => void;

export default class Command {

    private readonly name: string;

    public readonly executor: Executor

    constructor(name: string, executor: Executor) {
        this.name = name;
        this.executor = executor;
    }

}