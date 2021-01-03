export default class Command {

    public readonly description: string;

    public readonly executor: Executor

    public readonly args: string[];

    constructor(description: string, executor: Executor, ...args: string[]) {
        this.description = description;
        this.executor = executor;
        this.args = args || [];
    }

}