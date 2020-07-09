import { BinaryView, Read, Write, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { XPrv } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { ReadBlob, WriteBlob } from "./blob";

export const ReadXPrv = Read((view: BinaryView, gOrd: Data.Order<OtGlyph>) => {
    const majorVersion = view.uint16();
    const minorVersion = view.uint16();
    Assert.SubVersionSupported("ExtPrivateTable", majorVersion, minorVersion, [0, 1]);
    const table = new XPrv.Table();
    const pSharedBlob = view.ptr32Nullable();
    const pPerGlyphBlob = view.ptr32Nullable();
    if (pSharedBlob) {
        table.shared = pSharedBlob.next(ReadBlob);
    }
    if (pPerGlyphBlob) {
        table.perGlyph = new Map();
        const nRecords = pPerGlyphBlob.uint16();
        for (let id = 0; id < nRecords; id++) {
            const gid = pPerGlyphBlob.uint16();
            const blob = pPerGlyphBlob.ptr32().next(ReadBlob);
            table.perGlyph.set(gOrd.at(gid), blob);
        }
    }
    return table;
});

export const WriteXPrv = Write((fr, table: XPrv.Table, gOrd: Data.Order<OtGlyph>) => {
    fr.uint16(0).uint16(1); // version
    fr.ptr32(table.shared ? Frag.from(WriteBlob, table.shared) : null);
    if (!table.perGlyph) {
        fr.ptr32(null);
    } else {
        const frPerGlyph = new Frag();
        const mapping: [number, XPrv.Blob][] = [];
        for (const [g, blob] of table.perGlyph) mapping.push([gOrd.reverse(g), blob]);
        mapping.sort((a, b) => a[0] - b[0]);
        frPerGlyph.uint16(mapping.length);
        for (const [gid, blob] of mapping) {
            frPerGlyph.uint16(gid).ptr32(Frag.from(WriteBlob, blob));
        }
        fr.ptr32(frPerGlyph);
    }
});
