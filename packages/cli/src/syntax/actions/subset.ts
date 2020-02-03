import { CliProc, Ot } from "ot-builder";
import { ParseResult } from "../../argv-parser";
import { CliHelpShower } from "../../cli-help";
import { CliOptionStyle, CliParamStyle } from "../../cli-help/style";
import { CliAction, Syntax } from "../../command";

export const SubsetSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--subset")) return ParseResult(st, null);

        const prArg = st.nextArgument();
        return ParseResult(prArg.progress.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to subset.");
            console.log(`Subset ${entry}`);
            const gcBefore = entry.font.glyphs.decideOrder().length;
            const gcResult = CliProc.subsetFont(
                entry.font,
                prArg.result,
                Ot.ListGlyphStoreFactory
            );
            const gcAfter = gcResult.glyphs.decideOrder().length;

            state.push(entry.fill(gcResult));
            console.log(`  Glyphs: ${gcAfter} / ${gcBefore}`);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(CliOptionStyle`--subset`, CliParamStyle`text`);
        shower.indent("").message("Subset the font at the stack top according to the text given.");
    }
};
