import * as Chalk from "chalk";

export interface ParseState {
    next(): ParseState;
    isEof(): this is ParsingEof;
    isOption(...options: string[]): this is ParsingOption;
    isArgument(): this is ParsingArgument;
    nextArgument(): ParseResult<string>;
    reportParseErrorPosition(): string;
}
export interface ParsingEof {
    readonly eof: boolean;
}
export interface ParsingOption {
    readonly option: string;
}
export interface ParsingArgument {
    readonly argument: string;
}

export type ParseResult<R> = {
    progress: ParseState;
    result: R;
};
export function ParseResult<R>(progress: ParseState, result: R): ParseResult<R> {
    return { progress, result };
}

export function StartParseArgv(argv: string[], index = 0): ParseState {
    return new ParseArgvImpl(argv, index);
}

///////////////////////////////////////////////////////////////////////////////////////////////////

class ParseArgvImpl implements ParseState, ParsingEof, ParsingOption, ParsingArgument {
    constructor(private readonly argv: string[], private readonly cp: number) {
        this.eof = this.cp < this.argv.length;
        this.option = this.argument = this.argv[cp];
    }

    public readonly eof: boolean;
    public readonly option: string;
    public readonly argument: string;

    public next(): ParseState {
        return new ParseArgvImpl(this.argv, this.cp + 1);
    }
    public isEof() {
        return this.cp >= this.argv.length;
    }
    public isOption(...options: string[]) {
        if (this.isEof()) return false;
        const opt = this.argv[this.cp];
        if (opt[0] !== "-" && opt[0] !== "+") return false;

        if (!options.length) return true;
        for (const option of options) {
            if (opt === option) return true;
        }
        return false;
    }
    public isArgument() {
        return !this.isEof() && !this.isOption();
    }
    public nextArgument() {
        const nx = this.next();
        if (nx.isArgument()) {
            return ParseResult(nx, nx.argument);
        } else {
            throw new TypeError("Not argument.");
        }
    }
    public reportParseErrorPosition() {
        let s = "";
        for (let cp = 0; cp < this.argv.length; cp++) {
            if (cp === 0) continue;
            if (s) s += " ";
            const segmentText = cp === 0 ? "node" : cp === 1 ? "otb-cli" : this.argv[cp];
            if (cp === this.cp) s += Chalk.bold.red.underline(segmentText);
            else s += segmentText;
        }
        return s;
    }
}
