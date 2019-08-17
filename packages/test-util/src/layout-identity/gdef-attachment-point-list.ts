import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../compar-util";

export namespace GdefAttachmentPointListIdentity {
    type AttachmentPointList = Gdef.AttachPointListT<OtGlyph>;

    function testSingle(bim: BimapCtx<OtGlyph>, a: AttachmentPointList, b: AttachmentPointList) {
        for (const [glyph, pl] of a) expect(b.get(bim.forward(glyph))).toEqual(pl);
    }

    export const test = StdCompare(testSingle);
}
