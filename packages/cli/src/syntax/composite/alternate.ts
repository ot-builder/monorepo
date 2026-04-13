import { type CliHelpShower, Style } from "@ot-builder/cli-help-shower";

import { ParseResult, type ParseState } from "../../argv-parser";
import type { Grammar, Syntax } from "../../command";

export class AlternateSyntax<T> implements Syntax<null | T> {
    public constructor(private readonly alternatives: Syntax<null | T>[]) {}
    public handle(st: ParseState, grammar: Grammar) {
        for (const alternative of this.alternatives) {
            const result = alternative.handle(st, grammar);
            if (result.result) return result;
        }
        return ParseResult(st, null);
    }
    public displayHelp(shower: CliHelpShower) {
        const indented = shower.indent(Style.Bullet);
        for (const alt of this.alternatives) {
            alt.displayHelp(indented);
        }
    }
}
