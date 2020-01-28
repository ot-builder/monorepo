import { ParseState, ParseResult } from "../argv-parser";
import { Syntax, Grammar } from "../command";

export class AlternateSyntax<T> implements Syntax<null | T> {
    constructor(private readonly alternatives: Syntax<null | T>[]) {}
    handle(st: ParseState, grammar: Grammar) {
        for (const alternative of this.alternatives) {
            const result = alternative.handle(st, grammar);
            if (result.result) return result;
        }
        return ParseResult(st, null);
    }
}
