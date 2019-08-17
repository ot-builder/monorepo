export interface LogConfig {
    readonly log: Logger;
}
export interface Logger {
    readonly verbosity: number;
    scope(s: string): LogConfig;
    trace(...parts: Loggable[]): void;
    debug(...parts: Loggable[]): void;
    info(...parts: Loggable[]): void;
    warn(...parts: Loggable[]): void;
    error(...parts: Loggable[]): void;
    fatal(...parts: Loggable[]): void;
}

export type Loggable = null | undefined | number | string | boolean | LogComposite<any>;
export type LogInterpretFn = (x: Loggable) => string;
export type LogFormatFn<T extends any[]> = (rec: LogInterpretFn, ...args: T) => string;
export interface LogComposite<T extends any[]> {
    readonly formatter: LogFormatFn<T>;
    readonly args: T;
}

export function Formatter<T extends any[]>(fn: LogFormatFn<T>) {
    return (...args: T) => ({ formatter: fn, args } as LogComposite<T>);
}
