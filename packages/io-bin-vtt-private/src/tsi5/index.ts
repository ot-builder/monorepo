import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { TSI5 } from "@ot-builder/ot-vtt-private";
import { Data } from "@ot-builder/prelude";

export const TSI5Table = {
    ...Read((view: BinaryView, gOrd: Data.Order<OtGlyph>) => {
        const table = new TSI5.Table();
        for (const glyph of gOrd) {
            table.charGroupFlags.set(glyph, view.uint16());
        }
        return table;
    }),
    ...Write((frag: Frag, table: TSI5.Table, gOrd: Data.Order<OtGlyph>) => {
        for (const glyph of gOrd) {
            frag.uint16(table.charGroupFlags.get(glyph) || 0);
        }
    })
};
