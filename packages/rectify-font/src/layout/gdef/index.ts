import { RectifyImpl } from "@ot-builder/common-impl";
import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

export function rectifyGdefGlyphs(gdef: Ot.Gdef.Table, rec: Rectify.Glyph.RectifierT<Ot.Glyph>) {
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
    gdef: Ot.Gdef.Table,
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>
) {
    const newTable = new Ot.Gdef.Table();
    newTable.glyphClassDef = gdef.glyphClassDef;
    newTable.attachList = gdef.attachList;
    newTable.markAttachClassDef = gdef.markAttachClassDef;
    newTable.markGlyphSets = gdef.markGlyphSets;
    if (gdef.ligCarets) {
        newTable.ligCarets = RectifyImpl.mapSomeT(
            rec,
            gdef.ligCarets,
            RectifyImpl.Id,
            rectifyLigCaretArrayCoord
        );
    }
    return newTable;
}
export function rectifyGdefPointAttachment(
    gdef: Ot.Gdef.Table,
    rec: Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>
) {
    const newTable = new Ot.Gdef.Table();
    newTable.glyphClassDef = gdef.glyphClassDef;
    newTable.attachList = gdef.attachList;
    newTable.markAttachClassDef = gdef.markAttachClassDef;
    newTable.markGlyphSets = gdef.markGlyphSets;
    if (gdef.ligCarets) {
        newTable.ligCarets = rectifyLigCaretListPointAttachment(rec, gdef.ligCarets);
    }
    return newTable;
}

function rectifyLigCaretCoord(
    rec: Rectify.Coord.RectifierT<Ot.Var.Value>,
    lc: Ot.Gdef.LigCaret
): Ot.Gdef.LigCaret {
    return { ...lc, x: rec.coord(lc.x) };
}

function rectifyLigCaretArrayCoord(
    r: Rectify.Coord.RectifierT<Ot.Var.Value>,
    lcs: Ot.Gdef.LigCaret[]
) {
    return RectifyImpl.listSomeT(r, lcs, rectifyLigCaretCoord);
}

function rectifyLigCaretPointAttachment(
    rectifier: Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>,
    context: Ot.Glyph,
    lc: Ot.Gdef.LigCaret
): Ot.Gdef.LigCaret {
    if (!lc.pointAttachment) return lc;

    const desired = rectifier.getGlyphPoint(context, lc.pointAttachment.pointIndex);
    if (!desired) return { ...lc, pointAttachment: null };

    const accept = rectifier.acceptOffset(desired, lc);
    if (accept.x) return lc;

    switch (rectifier.manner) {
        case Rectify.PointAttach.Manner.TrustAttachment:
            return { ...lc, x: desired.x };
        case Rectify.PointAttach.Manner.TrustCoordinate:
            return { ...lc, pointAttachment: null };
    }
}

function rectifyLigCaretArrayPointAttachment(
    rec: Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>,
    g: Ot.Glyph,
    lcs: Ot.Gdef.LigCaret[]
) {
    return RectifyImpl.listSomeT(rec, lcs, (rec, lc) => rectifyLigCaretPointAttachment(rec, g, lc));
}

function rectifyLigCaretListPointAttachment(
    rec: Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>,
    lcs: Ot.Gdef.LigCaretList
): Ot.Gdef.LigCaretList {
    return RectifyImpl.mapSome2T(rec, lcs, RectifyImpl.Id, rectifyLigCaretArrayPointAttachment);
}
