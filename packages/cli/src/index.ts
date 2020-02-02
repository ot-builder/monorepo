import { StartParseArgv } from "./argv-parser";
import { createGrammar } from "./create-grammar";
import { CliState } from "./state";

export { CliProc } from "./create-grammar";

export async function cliMain(argv: string[]) {
    const parse = StartParseArgv(argv, 2);
    const syntax = createGrammar();
    const prActions = syntax.start.handle(parse, syntax);
    if (!prActions.progress.isEof()) {
        throw new SyntaxError("Remaining item");
    }
    if (prActions.result) {
        const state = new CliState();
        for (const action of prActions.result) {
            await action(state);
        }
    }
}
