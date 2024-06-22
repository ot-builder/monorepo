import { Style } from "@ot-builder/cli-help-shower";

export interface ParseState {
    next(): ParseState;
    isEof(): this is ParsingEof;
    isOption(...options: string[]): this is ParsingOption;
    expectOption(...options: string[]): string;
    isArgument(): this is ParsingArgument;
    expectArgument(): string;
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
    constructor(
        private readonly argv: string[],
        private readonly cp: number
    ) {
        this.eof = this.cp >= this.argv.length;
        this.option = this.argument = this.argv[cp];
    }

    public readonly eof: boolean;
    public readonly option: string;
    public readonly argument: string;

    public next(): ParseState {
        return new ParseArgvImpl(this.argv, this.cp + 1);
    }

    public isEof(): this is ParsingEof {
        return this.eof;
    }

    public isOption(...options: string[]): this is ParsingOption {
        return this.isOptionImpl(...options);
    }
    private isOptionImpl(...options: string[]): boolean {
        if (this.eof) return false;

        const opt = this.argv[this.cp];
        if (opt[0] !== "-" && opt[0] !== "+") return false;

        if (!options.length) return true;
        for (const option of options) {
            if (opt === option) return true;
        }
        return false;
    }
    public expectOption(...options: string[]) {
        if (!this.isOption(...options)) throw new TypeError("Not option.");
        return this.option;
    }

    public isArgument(): this is ParsingArgument {
        return !this.eof && !this.isOptionImpl();
    }
    public expectArgument() {
        if (!this.isArgument()) throw new TypeError("Not argument.");
        return this.argument;
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
            if (cp === this.cp) s += Style.ArgvParseError(segmentText);
            else s += segmentText;
        }
        return s;
    }
}
