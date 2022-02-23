import { CliHelpShower, Style } from "@ot-builder/cli-help-shower";
import { CliProc, Ot } from "ot-builder";

import { ParseResult } from "../../argv-parser";
import { CliAction, Syntax } from "../../command";

export const TransformGlyphsSyntax: Syntax<null | CliAction> = {
    handle: st => {
        if (!st.isOption("--transform-glyphs")) return ParseResult(st, null);
        st = st.next();

        const prArg = st.expectArgument();
        const tfmArgs = prArg.split(",");
        const transform: Ot.Glyph.Transform2X3 = {
            xx: parseFloat(tfmArgs[0].trim()),
            yx: parseFloat(tfmArgs[1].trim()),
            xy: parseFloat(tfmArgs[2].trim()),
            yy: parseFloat(tfmArgs[3].trim()),
            dx: parseFloat(tfmArgs[4].trim()),
            dy: parseFloat(tfmArgs[5].trim())
        };

        return ParseResult(st.next(), async state => {
            const entry = state.pop();
            if (!entry) throw new RangeError("Stack size invalid. No font to do GC.");
            CliProc.inPlaceTransformFontGlyph(entry.font, transform);
            state.push(entry);
        });
    },
    displayHelp(shower: CliHelpShower) {
        shower.message(Style.Option`--transform-glyphs`, Style.Param`xx,yx,xy,yy,dx,dy`);
        shower
            .indent("")
            .message(
                "Perform a 2x3 affine transform to all glyphs' geometries in the font.",
                "Composite fonts will be flattened."
            );
    }
};
