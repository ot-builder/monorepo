import { Logger } from "./interface";

export class NopLogger implements Logger {
    public readonly verbosity = Infinity;
    public scope(s: string) {
        return { log: new NopLogger() };
    }
    public trace() {}
    public debug() {}
    public info() {}
    public warn() {}
    public error() {}
    public fatal() {}
}
