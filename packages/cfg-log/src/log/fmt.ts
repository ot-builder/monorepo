import { Formatter, LogComposite, LogInterpretFn } from "./interface";

export namespace fmt {
    export const red = Formatter(
        <T extends any[]>(rec: LogInterpretFn, x: LogComposite<T>) =>
            "\x1b[31m" + rec(x) + "\x1b[0m"
    );
    export const hex = Formatter((rec, n: number, digits = 0) => {
        let s = n.toString(16);
        while (s.length < digits) s = "0" + s;
        return s;
    });
}
