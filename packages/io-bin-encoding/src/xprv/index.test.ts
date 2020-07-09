import { Frag, BinaryView } from "@ot-builder/bin-util";
import { XPrv } from "@ot-builder/ot-encoding";
import { OtListGlyphStoreFactory } from "@ot-builder/ot-glyphs";

import { WriteXPrv, ReadXPrv } from "./index";

test("ExtPrivate roundtrip", () => {
    const count = 0x100;
    const gOrd = OtListGlyphStoreFactory.createStoreFromSize(count).decideOrder();
    const xPrv = new XPrv.Table();
    xPrv.shared = new Map([["test", Buffer.from("shared data", "utf-8")]]);
    xPrv.perGlyph = new Map([
        [
            gOrd.at(1),
            new Map([
                ["test 2", Buffer.from("Per glyph data 2-1", "utf-8")],
                ["test 3", Buffer.from("Per glyph data 2-2", "utf-8")]
            ])
        ],
        [
            gOrd.at(2),
            new Map([
                ["test 2", Buffer.from("Per glyph data 2-3", "utf-8")],
                ["test 3", Buffer.from("Per glyph data 2-4", "utf-8")]
            ])
        ]
    ]);

    const bufXPrv = Frag.packFrom(WriteXPrv, xPrv, gOrd);
    const xPrv1 = new BinaryView(bufXPrv).next(ReadXPrv, gOrd);
    expect(xPrv1.shared).toEqual(xPrv.shared);
    expect(xPrv1.perGlyph).toEqual(xPrv.perGlyph);
});
