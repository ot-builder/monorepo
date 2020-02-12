import * as Ot from "@ot-builder/font";

import {
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../../interface";
import { RectifyImpl } from "../../shared";

export function rectifyGdefGlyphs(rec: GlyphReferenceRectifier, gdef: Ot.Gdef.Table) {
    const newTable = new Ot.Gdef.Table();
    if (gdef.glyphClassDef) {
        newTable.glyphClassDef = RectifyImpl.Glyph.mapSome(rec, gdef.glyphClassDef);
    }
    if (gdef.attachList) {
        newTable.attachList = RectifyImpl.Glyph.mapSome(rec, gdef.attachList);
    }
    if (gdef.ligCarets) {
        newTable.ligCarets = RectifyImpl.Glyph.mapSome(rec, gdef.ligCarets);
    }
    if (gdef.markAttachClassDef) {
        newTable.markAttachClassDef = RectifyImpl.Glyph.mapSome(rec, gdef.markAttachClassDef);
    }
    if (gdef.markGlyphSets) {
        newTable.markGlyphSets = RectifyImpl.listSomeT(
            rec,
            gdef.markGlyphSets,
            RectifyImpl.Glyph.setSome
        );
    }
    return newTable;
}

export function rectifyGdefCoords(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    gdef: Ot.Gdef.Table
) {
    const newTable = new Ot.Gdef.Table();
    newTable.glyphClassDef = gdef.glyphClassDef;
    newTable.attachList = gdef.attachList;
    newTable.markAttachClassDef = gdef.markAttachClassDef;
    newTable.markGlyphSets = gdef.markGlyphSets;
    if (gdef.ligCarets) {
        newTable.ligCarets = rectifyLigCaretListPointAttachment(
            recPA,
            RectifyImpl.mapSomeT(
                recCoord,
                gdef.ligCarets,
                RectifyImpl.Id,
                rectifyLigCaretArrayCoord
            )
        );
    }
    return newTable;
}

function rectifyLigCaretCoord(rec: CoordRectifier, lc: Ot.Gdef.LigCaret): Ot.Gdef.LigCaret {
    return { ...lc, x: rec.coord(lc.x) };
}

function rectifyLigCaretArrayCoord(r: CoordRectifier, lcs: Ot.Gdef.LigCaret[]) {
    return RectifyImpl.listSomeT(r, lcs, rectifyLigCaretCoord);
}

function rectifyLigCaretPointAttachment(
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

function rectifyLigCaretArrayPointAttachment(
    rec: PointAttachmentRectifier,
    g: Ot.Glyph,
    lcs: Ot.Gdef.LigCaret[]
) {
    return RectifyImpl.listSomeT(rec, lcs, (rec, lc) =>
        rectifyLigCaretPointAttachment(rec, g, lc)
    );
}

function rectifyLigCaretListPointAttachment(
    rec: PointAttachmentRectifier,
    lcs: Ot.Gdef.LigCaretList
): Ot.Gdef.LigCaretList {
    return RectifyImpl.mapSome2T(rec, lcs, RectifyImpl.Id, rectifyLigCaretArrayPointAttachment);
}
