import { readEncoding, DefaultEncodingCfg } from "@ot-builder/io-bin-encoding";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { readSfntOtf, SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { OtFontLayoutData } from "@ot-builder/ot-layout";
import { Fvar } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";

import { readOtl } from "../main/read";
import { writeOtl } from "../main/write";

export type TestOtlLoopYield = {
    round: number;
    otl: OtFontLayoutData;
    gOrd: Data.Order<OtGlyph>;
    fvar: Data.Maybe<Fvar.Table>;
    cmap: Cmap.Table;
};

export function* TestOtlLoop(file: string): IterableIterator<TestOtlLoopYield> {
    const bufFont = TestFont.get(file);
    const sfnt = readSfntOtf(bufFont);
    const cfg = { fontMetadata: {}, encoding: DefaultEncodingCfg };

    const md = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(md.maxp.numGlyphs);
    const gOrd = gs.decideOrder();

    const encoding = readEncoding(sfnt, cfg, gOrd, md);

    const otlPreRoundtrip = readOtl(sfnt, gOrd, md);

    yield { round: 0, otl: otlPreRoundtrip, gOrd, fvar: md.fvar, cmap: encoding.cmap! };

    const tempSfnt = new Sfnt(0x10000);
    const sink = new SfntIoTableSink(tempSfnt);
    writeOtl(sink, otlPreRoundtrip, gOrd, md);

    const otlPostRoundtrip = readOtl(tempSfnt, gOrd, md);
    yield { round: 1, otl: otlPostRoundtrip, gOrd, fvar: md.fvar, cmap: encoding.cmap! };
}
