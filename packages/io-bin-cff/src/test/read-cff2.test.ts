import { BinaryView } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { Cff, OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";
import { OtVar } from "@ot-builder/variance";

import { DefaultCffCfgProps } from "../cfg";
import { ReadCff2 } from "../main/read-cff2";

function readCff2(file: string) {
    const bufFont = TestFont.get("SourceSerifVariable-Roman.otf");
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = Config.create({ cff: DefaultCffCfgProps, fontMetadata: {} });
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const axes = fvar ? Data.Order.fromList("Axes", fvar.axes) : null;

    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const { cff } = new BinaryView(sfnt.tables.get(Cff.Tag2)!).next(
        ReadCff2,
        cfg,
        gs.decideOrder(),
        axes
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
