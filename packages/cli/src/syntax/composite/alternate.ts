import { ParseState, ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { Bullet } from "../../cli-help/style";
import { Syntax, Grammar } from "../../command";

export class AlternateSyntax<T> implements Syntax<null | T> {
    constructor(private readonly alternatives: Syntax<null | T>[]) {}
    public handle(st: ParseState, grammar: Grammar) {
        for (const alternative of this.alternatives) {
            const result = alternative.handle(st, grammar);
            if (result.result) return result;
        }
        return ParseResult(st, null);
    }
    public displayHelp(shower: CliHelpShower) {
        const indented = shower.indent(Bullet);
        for (const alt of this.alternatives) {
            alt.displayHelp(indented);
        }
    }
}
