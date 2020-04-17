import { BinaryView } from "@ot-builder/bin-util";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf } from "@ot-builder/io-bin-sfnt";
import { Cff, OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { DefaultCffCfgProps } from "../cfg";
import { ReadCff2 } from "../main/read-cff2";

function readCff2(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { cff: DefaultCffCfgProps, fontMetadata: {} };
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const designSpace = fvar ? fvar.getDesignSpace() : null;

    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const { cff } = new BinaryView(sfnt.tables.get(Cff.Tag2)!).next(
        ReadCff2,
        cfg,
        gs.decideOrder(),
        designSpace
    );
    return { gs, cff };
}

test("Reading : CFF2", () => {
    const { gs, cff } = readCff2("SourceSerifVariable-Roman.otf");
    {
        const b = gs.items[3];
        const csB = b.geometry! as OtGlyph.ContourSet;
        expect(csB.contours.length).toBe(4);
        for (const contour of csB.contours) {
            expect(true).toBe(OtVar.Ops.equal(contour[0].x, contour[contour.length - 1].x, 1));
            expect(true).toBe(OtVar.Ops.equal(contour[0].y, contour[contour.length - 1].y, 1));
        }
    }
});
