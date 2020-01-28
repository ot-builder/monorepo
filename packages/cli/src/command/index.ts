import { ParseResult, ParseState } from "../argv-parser";
import { CliState } from "../state";

export type CliAction = (state: CliState) => Promise<void>;
export interface Syntax<T> {
    handle(st: ParseState, grammar: Grammar): ParseResult<T>;
}
export type Grammar = {
    start: Syntax<CliAction[]>;
    element: Syntax<null | CliAction>;
};
