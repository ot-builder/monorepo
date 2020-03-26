import { BinaryView, Frag } from "@ot-builder/bin-util";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Cff, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { GlyphIdentity, TestFont } from "@ot-builder/test-util";

import { CffCfgProps, DefaultCffCfgProps } from "../cfg";
import { ReadCff2 } from "../main/read-cff2";
import { WriteCff2 } from "../main/write-cff2";

function cff2RoundTripLoop(file: string, override: Partial<CffCfgProps>) {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { cff: { ...DefaultCffCfgProps, ...override }, fontMetadata: {} };
    const { head, maxp, fvar } = readOtMetadata(sfnt, cfg);
    const designSpace = fvar ? fvar.getDesignSpace() : null;

    const gs = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);

    const timeStart = new Date();
    const { cff: cff } = new BinaryView(sfnt.tables.get(Cff.Tag2)!).next(
        ReadCff2,
        cfg,
        gs.decideOrder(),
        designSpace
    );
    const timeRead = new Date();
    const bufCff = Frag.pack(Frag.from(WriteCff2, cff, gs.decideOrder(), cfg, head, designSpace));
    const timeWritten = new Date();

    const gs1 = OtListGlyphStoreFactory.createStoreFromSize(maxp.numGlyphs);
    const { cff: cff1 } = new BinaryView(bufCff).next(
        ReadCff2,
        cfg,
        gs1.decideOrder(),
        designSpace
    );

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

test("CFF2 Write: roundtrip, Source Serif Variable Roman", () => {
    cff2RoundTripLoop("SourceSerifVariable-Roman.otf", DontOptimize);
    cff2RoundTripLoop("SourceSerifVariable-Roman.otf", Optimize);
});
test("CFF2 Write: roundtrip, AdobeVFPrototype.otf", () => {
    cff2RoundTripLoop("AdobeVFPrototype.otf", DontOptimize);
    cff2RoundTripLoop("AdobeVFPrototype.otf", Optimize);
});
test("CFF2 Write: roundtrip, Source Serif Variable Italic", () => {
    cff2RoundTripLoop("SourceSerifVariable-Italic.otf", DontOptimize);
    cff2RoundTripLoop("SourceSerifVariable-Italic.otf", Optimize);
});
