import * as Ot from "@ot-builder/font";
import * as Rectify from "@ot-builder/rectify-font";
import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";
import { StdPointAttachRectifier } from "../../support/point-rectifier";
import { CliHelpShower } from "../../cli-help";

export const RebaseSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--rebase")) return ParseResult(st, null);

        const prArg = st.nextArgument();
        return ParseResult(prArg.progress.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to rebase.");
            const newUpm = parseFloat(prArg.result) || entry.font.head.unitsPerEm;
            console.log(`Rebase ${entry} to ${newUpm}`);
            rebaseFont(entry.font, newUpm);
            state.push(entry);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(`--rebase <upm>`);
        shower.indent("").message("Change the unit-per-em value of the font at the stack top.");
    }
};

export function rebaseFont<GS extends Ot.GlyphStore>(font: Ot.Font<GS>, newUpm: number) {
    Rectify.rectifyFontCoords(
        createAxisRectifier(),
        createValueRectifier(newUpm, font.head.unitsPerEm),
        new StdPointAttachRectifier(Rectify.PointAttachmentRectifyManner.TrustAttachment),
        font
    );
    font.head.unitsPerEm = newUpm;
}

function createAxisRectifier(): Rectify.AxisRectifier {
    return {
        dim: a => a,
        axis: a => a,
        addedAxes: []
    };
}

function createValueRectifier(newUpm: number, oldUpm: number): Rectify.CoordRectifier {
    return {
        coord: x => Ot.Var.Ops.scale(newUpm / oldUpm, x),
        cv: x => Ot.Var.Ops.scale(newUpm / oldUpm, x)
    };
}
