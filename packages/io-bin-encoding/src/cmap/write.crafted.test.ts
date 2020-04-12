import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
import { BimapCtx, CmapIdentity } from "@ot-builder/test-util";

import { ReadCmap } from "./read";
import { WriteCmap } from "./write";

function cmapCraftedRoundtrip(count: number, fn: (gid: number) => number) {
    const gOrd = OtListGlyphStoreFactory.createStoreFromSize(count).decideOrder();
    const cmap = new Cmap.Table();

    for (let gid = 0; gid < count; gid++) cmap.unicode.set(fn(gid), gOrd.at(gid));

    const bufCmap = Frag.pack(Frag.from(WriteCmap, cmap, gOrd));
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
