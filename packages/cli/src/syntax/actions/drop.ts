import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const DropSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--drop-otl", "--drop-math", "--drop-base", "--drop-hints"))
            return ParseResult(st, null);
        const opt = st.option;

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to do handle.");
            switch (opt) {
                case "--drop-otl": {
                    entry.font.gsub = null;
                    entry.font.gpos = null;
                    entry.font.gdef = null;
                    break;
                }
                case "--drop-math": {
                    entry.font.math = null;
                    break;
                }
                case "--drop-base": {
                    entry.font.base = null;
                    break;
                }
                case "--drop-hints": {
                    if (Ot.Font.isTtf(entry.font)) {
                        entry.font.fpgm = null;
                        entry.font.prep = null;
                        entry.font.cvt = null;
                        entry.font.vdmx = null;
                    }
                    for (const g of entry.font.glyphs.decideOrder()) g.hints = null;
                    break;
                }
            }

            state.push(entry);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`--drop-otl`);
        shower
            .indent("")
            .message("Drops OTL information of the font. Removes GSUB, GPOS and GDEF tables.");
        shower.message(Style.Option`--drop-base`);
        shower.indent("").message("Drops BASE table of the font.");
        shower.message(Style.Option`--drop-math`);
        shower.indent("").message("Drops MATH table of the font.");
        shower.message(Style.Option`--drop-hints`);
        shower.indent("").message("Drops hinting information of the font");
    }
};
