import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntBuf, SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { OtFontLayoutData } from "@ot-builder/ot-layout";
import { Fvar } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";

import { readOtl } from "../main/read";
import { writeOtl } from "../main/write";

export type TestOtlLoopYield = {
    otl: OtFontLayoutData;
    gOrd: Data.Order<OtGlyph>;
    fvar: Data.Maybe<Fvar.Table>;
};

export function* TestOtlLoop(file: string): IterableIterator<TestOtlLoopYield> {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntBuf(bufFont);
    const cfg = { fontMetadata: {} };
    const md = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(md.maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const otlPreRoundtrip = readOtl(sfnt, gOrd, md);

    yield { otl: otlPreRoundtrip, gOrd, fvar: md.fvar };

    const tempSfnt = new Sfnt(0x10000);
    const sink = new SfntIoTableSink(tempSfnt);
    writeOtl(sink, otlPreRoundtrip, gOrd, md);

    const otlPostRoundtrip = readOtl(tempSfnt, gOrd, md);
    yield { otl: otlPostRoundtrip, gOrd, fvar: md.fvar };
}
