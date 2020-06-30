import { ImpLib } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/ot";

import {
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../../interface";
import { RectifyImpl } from "../../shared";

export function rectifyGdef(
    recGlyphRef: GlyphReferenceRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    gdef: Ot.Gdef.Table
) {
    const newTable = new Ot.Gdef.Table();
    if (gdef.glyphClassDef) {
        newTable.glyphClassDef = RectifyImpl.Glyph.mapSome(recGlyphRef, gdef.glyphClassDef);
    }
    if (gdef.attachList) {
        newTable.attachList = RectifyImpl.Glyph.mapSome(recGlyphRef, gdef.attachList);
    }
    if (gdef.markAttachClassDef) {
        newTable.markAttachClassDef = RectifyImpl.Glyph.mapSome(
            recGlyphRef,
            gdef.markAttachClassDef
        );
    }
    if (gdef.markGlyphSets) {
        newTable.markGlyphSets = RectifyImpl.listSomeT(
            recGlyphRef,
            gdef.markGlyphSets,
            RectifyImpl.Glyph.setSome
        );
    }
    if (gdef.ligCarets) {
        newTable.ligCarets = new ImpLib.FunctionHelper.Chain(gdef.ligCarets)
            .apply(_ => RectifyImpl.Glyph.mapSome(recGlyphRef, _))
            .apply(_ => RectifyImpl.mapSomeT(recCoord, _, RectifyImpl.Id, ligCaretArrayCoord))
            .apply(_ => RectifyImpl.mapSome2T(recPA, _, RectifyImpl.Id, ligCaretArrayPA)).result;
    }
    return newTable;
}

function ligCaretArrayCoord(r: CoordRectifier, lcs: Ot.Gdef.LigCaret[]) {
    return RectifyImpl.listSomeT(r, lcs, ligCaretCoord);
}
function ligCaretCoord(rec: CoordRectifier, lc: Ot.Gdef.LigCaret): Ot.Gdef.LigCaret {
    return { ...lc, x: rec.coord(lc.x) };
}

function ligCaretArrayPA(rec: PointAttachmentRectifier, g: Ot.Glyph, lcs: Ot.Gdef.LigCaret[]) {
    return RectifyImpl.listSomeT(rec, lcs, (rec, lc) => ligCaretPointAttachment(rec, g, lc));
}
function ligCaretPointAttachment(
    rectifier: PointAttachmentRectifier,
    context: Ot.Glyph,
    lc: Ot.Gdef.LigCaret
): Ot.Gdef.LigCaret {
    if (!lc.pointAttachment) return lc;

    const desired = RectifyImpl.getGlyphPoints(context)[lc.pointAttachment.pointIndex];
    if (!desired) return { ...lc, pointAttachment: null };

    const accept = rectifier.acceptOffset(desired, { x: lc.x, y: desired.y });
    if (accept.x) return lc;

    switch (rectifier.manner) {
        case PointAttachmentRectifyManner.TrustAttachment:
            return { ...lc, x: desired.x };
        case PointAttachmentRectifyManner.TrustCoordinate:
            return { ...lc, pointAttachment: null };
    }
}
