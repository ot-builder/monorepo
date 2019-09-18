import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";
import { OtVar } from "@ot-builder/variance";

import { BimapCtx, StdCompare } from "../compar-util";
import { FastMatch } from "../fast-match";

export namespace GdefLigCaretListIdentity {
    type CaretList = Gdef.LigCaretListT<OtGlyph, OtVar.Value>;

    function testSingle(bim: BimapCtx<OtGlyph>, a: CaretList, b: CaretList) {
        for (const [glyph, lc] of a) {
            const lcb = b.get(bim.forward(glyph)) || [];
            expect(lcb.length).toBe(lc.length);
            for (const [c1, c2, index] of ImpLib.Iterators.ZipWithIndex(lc, lcb)) {
                FastMatch.otvar(c1.x, c2.x, `lig caret ${index}`);
                expect(c1.pointAttachment).toEqual(c2.pointAttachment);
                expect(c1.xDevice).toEqual(c2.xDevice);
            }
        }
    }

    export const test = StdCompare(testSingle);
}
