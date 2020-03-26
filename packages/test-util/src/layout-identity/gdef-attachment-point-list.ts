import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../compar-util";

export namespace GdefAttachmentPointListIdentity {
    function testSingle(bim: BimapCtx<OtGlyph>, a: Gdef.AttachPointList, b: Gdef.AttachPointList) {
        for (const [glyph, pl] of a) expect(b.get(bim.forward(glyph))).toEqual(pl);
    }

    export const test = StdCompare(testSingle);
}
