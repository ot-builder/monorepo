import { CliHelpShower } from "@ot-builder/cli-help-shower";

import { ParseResult, ParseState } from "../../argv-parser";
import { Grammar, Syntax } from "../../command";

export interface Join<T> {
    join(items: T[]): T;
}

export class PossessiveRepeatSyntax<T> implements Syntax<T> {
    constructor(private readonly joiner: Join<T>, private readonly body: Syntax<null | T>) {}
    public handle(st0: ParseState, grammar: Grammar) {
        const results: T[] = [];
        let st = st0;
        for (;;) {
            const pr = this.body.handle(st, grammar);
            if (pr.result) {
                st = pr.progress;
                results.push(pr.result);
            } else {
                return ParseResult(st, this.joiner.join(results));
            }
        }
    }
    public displayHelp(shower: CliHelpShower) {
        this.body.displayHelp(shower);
    }
}
