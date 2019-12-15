import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Cff, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { CffCfgProps, DefaultCffCfgProps } from "../cfg";
import { ReadCff1 } from "../main/read-cff1";
import { WriteCff1 } from "../main/write-cff1";

function cff1RoundTripLoop(file: string, override: Partial<CffCfgProps>) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { cff: { ...DefaultCffCfgProps, ...override }, fontMetadata: {} };
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);

    const timeStart = new Date();
    const { cff: cff, cffGlyphNaming: naming } = new BinaryView(sfnt.tables.get(Cff.Tag1)!).next(
        ReadCff1,
        cfg,
        gs.decideOrder()
    );
    if (naming) for (const g of gs.items) g.name = naming.getName(g) || `?`;

    const timeRead = new Date();
    const bufCff = Frag.pack(Frag.from(WriteCff1, cff, gs.decideOrder(), cfg, head));
    const timeWritten = new Date();

    const gs1 = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const { cff: cff1 } = new BinaryView(bufCff).next(ReadCff1, cfg, gs1.decideOrder());

    GlyphIdentity.testStore(gs, gs1, GlyphIdentity.CompareMode.RemoveCycle);

    console.log(
        `Test file ${file}\n` +
            `CFF read time ${timeRead.valueOf() - timeStart.valueOf()}\n` +
            `CFF write time ${timeWritten.valueOf() - timeRead.valueOf()}`
    );
}

const DontOptimize: Partial<CffCfgProps> = {
    doGlobalOptimization: false,
    doLocalOptimization: false
};
const Optimize: Partial<CffCfgProps> = {
    doGlobalOptimization: true,
    doLocalOptimization: true
};

test("CFF1 Write: roundtrip, Source Serif Pro Regular", () => {
    cff1RoundTripLoop("SourceSerifPro-Regular.otf", DontOptimize);
    cff1RoundTripLoop("SourceSerifPro-Regular.otf", Optimize);
});
test("CFF1 Write: roundtrip, Inter Regular", () => {
    cff1RoundTripLoop("Inter-Regular.otf", DontOptimize);
    cff1RoundTripLoop("Inter-Regular.otf", Optimize);
});
test("CFF1 Write: roundtrip, KRName (CID)", () => {
    cff1RoundTripLoop("KRName-Regular.otf", DontOptimize);
    cff1RoundTripLoop("KRName-Regular.otf", Optimize);
});
