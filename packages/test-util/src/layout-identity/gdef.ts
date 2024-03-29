import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../compar-util";

import * as ClassDefIdentity from "./class-def";
import * as GdefAttachmentPointListIdentity from "./gdef/gdef-attachment-point-list";
import * as GdefLigCaretListIdentity from "./gdef/gdef-lig-caret-list";
import * as GdefMarkGlyphSetsIdentity from "./gdef/gdef-mark-glyph-sets";

function testSingle(bim: BimapCtx<OtGlyph>, a: Gdef.Table, b: Gdef.Table) {
    ClassDefIdentity.test(bim, a.glyphClassDef, b.glyphClassDef);
    GdefAttachmentPointListIdentity.test(bim, a.attachList, b.attachList);
    GdefLigCaretListIdentity.test(bim, a.ligCarets, b.ligCarets);
    ClassDefIdentity.test(bim, a.markAttachClassDef, b.markAttachClassDef);
    GdefMarkGlyphSetsIdentity.test(bim, a.markGlyphSets, b.markGlyphSets);
}

export const test = StdCompare(testSingle);
