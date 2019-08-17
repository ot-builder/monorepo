import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";

import { BimapCtx, StdCompare } from "../compar-util";

import { ClassDefIdentity } from "./class-def";
import { GdefAttachmentPointListIdentity } from "./gdef-attachment-point-list";
import { GdefLigCaretListIdentity } from "./gdef-lig-caret-list";
import { GdefMarkGlyphSetsIdentity } from "./gdef-mark-glyph-sets";

export namespace GdefIdentity {
    function testSingle(bim: BimapCtx<OtGlyph>, a: Gdef.Table, b: Gdef.Table) {
        ClassDefIdentity.test(bim, a.glyphClassDef, b.glyphClassDef);
        GdefAttachmentPointListIdentity.test(bim, a.attachList, b.attachList);
        GdefLigCaretListIdentity.test(bim, a.ligCarets, b.ligCarets);
        ClassDefIdentity.test(bim, a.markAttachClassDef, b.markAttachClassDef);
        GdefMarkGlyphSetsIdentity.test(bim, a.markGlyphSets, b.markGlyphSets);
    }

    export const test = StdCompare(testSingle);
}
