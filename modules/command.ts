export default class Command {

    public readonly name: string;

    public readonly executor: Executor

    constructor(name: string, executor: Executor) {
        this.name = name;
        this.executor = executor;
    }

}