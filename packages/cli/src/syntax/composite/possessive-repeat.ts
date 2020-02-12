import { ParseResult, ParseState } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { Syntax, Grammar } from "../../command";

export class PossessiveRepeatSyntax<T> implements Syntax<T[]> {
    constructor(private readonly body: Syntax<null | T>) {}
    handle(st0: ParseState, grammar: Grammar) {
        const results: T[] = [];
        let st = st0;
        for (;;) {
            const pr = this.body.handle(st, grammar);
            if (pr.result) {
                st = pr.progress;
                results.push(pr.result);
            } else {
                return ParseResult(st, results);
            }
        }
    }
    displayHelp(shower: CliHelpShower) {
        this.body.displayHelp(shower);
    }
}
