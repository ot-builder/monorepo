import { BinaryView } from "@ot-builder/bin-util";
import { Cff, OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { TestFont } from "@ot-builder/test-util";

import { DefaultCffCfgProps } from "../cfg";
import { ReadCff1 } from "../main/read-cff1";

function readCff1(file: string) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { cff: DefaultCffCfgProps, fontMetadata: {} };
    const { head, maxp } = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const { cff } = new BinaryView(sfnt.tables.get(Cff.Tag1)!).next(
        ReadCff1,
        cfg,
        gs.decideOrder()
    );
    return { gs, cff };
}

test("Reading : CFF1", () => {
    const { gs, cff } = readCff1("SourceSerifPro-Regular.otf");
    {
        const b = gs.items[3];
        const csB = b.geometry! as OtGlyph.ContourSet;
        expect(csB.contours.length).toBe(3);
        expect(b.horizontal.end).toBe(629);
    }
});

test("Reading : CFF1, CID", () => {
    const { gs, cff } = readCff1("KRName-Regular.otf");

    expect(cff.cid).toBeTruthy();
    expect(cff.cid!.registry).toBe("Adobe");
    expect(cff.cid!.ordering).toBe("Identity");
    expect(cff.cid!.supplement).toBe(0);
    expect(cff.fdArray!.length).toBe(1);

    for (let gid = 0; gid < gs.items.length; gid++) {
        expect(cff.cid!.mapping!.get(gid)).toBe(gs.items[gid]);
    }
});
