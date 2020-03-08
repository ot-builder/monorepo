import { BinaryView } from "@ot-builder/bin-util";
import { OtGlyph, OtListGlyphStoreFactory } from "@ot-builder/ft-glyphs";
import { OtFontLayoutData } from "@ot-builder/ft-layout";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { readOtMetadata } from "@ot-builder/io-bin-metadata";
import { SfntIoTableSink, SfntOtf } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { TestFont } from "@ot-builder/test-util";

import { readOtl } from "../main/read";
import { writeOtl } from "../main/write";

export type TestOtlLoopYield = { otl: OtFontLayoutData; gOrd: Data.Order<OtGlyph> };

export function* TestOtlLoop(file: string): IterableIterator<TestOtlLoopYield> {
    const bufFont = TestFont.get(file);
    const sfnt = new BinaryView(bufFont).next(SfntOtf);
    const cfg = { fontMetadata: {} };
    const md = readOtMetadata(sfnt, cfg);
    const gs = OtListGlyphStoreFactory.createStoreFromSize(md.maxp.numGlyphs);
    const gOrd = gs.decideOrder();
    const otlPreRoundtrip = readOtl(sfnt, gOrd, md);

    yield { otl: otlPreRoundtrip, gOrd };

    const tempSfnt = new Sfnt(0x10000);
    const sink = new SfntIoTableSink(tempSfnt);
    writeOtl(sink, otlPreRoundtrip, gOrd, md);

    const otlPostRoundtrip = readOtl(tempSfnt, gOrd, md);
    yield { otl: otlPostRoundtrip, gOrd };
}

// Jest needs this :(
test("Dummy for test util", () => {});
