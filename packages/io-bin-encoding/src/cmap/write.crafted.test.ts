import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { BimapCtx, CmapIdentity } from "@ot-builder/test-util";

import { DefaultEncodingCfgProps } from "../cfg";

import { ReadCmap } from "./read";
import { WriteCmap } from "./write";

function cmapCraftedRoundtrip(count: number, fn: (gid: number, codeLast: number) => number) {
    const gOrd = OtListGlyphStoreFactory.createStoreFromSize(count).decideOrder();
    const cmap = new Cmap.Table();

    let codeLast = 0;
    for (let gid = 0; gid < count; gid++) {
        codeLast = fn(gid, codeLast);
        if (codeLast > 0) cmap.unicode.set(codeLast, gOrd.at(gid));
    }

    const bufCmap = Frag.pack(
        Frag.from(WriteCmap, cmap, gOrd, { encoding: DefaultEncodingCfgProps })
    );
    const cmap1 = new BinaryView(bufCmap).next(ReadCmap, gOrd);

    CmapIdentity.test(BimapCtx.from(gOrd, gOrd), cmap, cmap1);
}

test("CMAP crafted roundtrip -- 1K", () => {
    cmapCraftedRoundtrip(1024, gid => gid);
});
test("CMAP crafted roundtrip -- 64K", () => {
    cmapCraftedRoundtrip(0xfffe, gid => gid);
});
test("CMAP crafted roundtrip -- 64K; anti", () => {
    cmapCraftedRoundtrip(0xfffe, gid => 0xfffe - gid);
});
test("CMAP crafted roundtrip -- 64K; anti; gaps", () => {
    cmapCraftedRoundtrip(0xfffe, gid => 0xfffe - gid + 0x100 * Math.floor(gid / 0x1000));
});
test("CMAP crafted roundtrip -- 64K; anti; thin gaps", () => {
    cmapCraftedRoundtrip(0xfffe, gid => 0x1ffff - gid * 2);
});
test("CMAP crafted roundtrip -- 64K; stairs", () => {
    cmapCraftedRoundtrip(0xfffe, (gid, last) => (gid % 3 === 0 ? last + 4 : last - 1));
});
test("CMAP crafted roundtrip -- 64K; two falls", () => {
    cmapCraftedRoundtrip(0xfffe, (gid, last) => {
        switch (gid) {
            case 0:
                return 0;
            case 1:
                return 0xfeff;
            case 0xff00:
                return 0xfffe;
            default:
                return last - 1;
        }
    });
});
