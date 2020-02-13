import * as Ot from "@ot-builder/font";

import { CoordRectifier, GlyphReferenceRectifier } from "../interface";
import { RectifyImpl } from "../shared";

function rectifyCoordPrivateDict(rec: CoordRectifier, pd: Ot.Cff.PrivateDict) {
    const result = new Ot.Cff.PrivateDict();
    result.blueValues = RectifyImpl.Coord.list(rec, pd.blueValues);
    result.otherBlues = RectifyImpl.Coord.list(rec, pd.otherBlues);
    result.familyBlues = RectifyImpl.Coord.list(rec, pd.familyBlues);
    result.familyOtherBlues = RectifyImpl.Coord.list(rec, pd.familyOtherBlues);
    result.stemSnapH = RectifyImpl.Coord.list(rec, pd.stemSnapH);
    result.stemSnapV = RectifyImpl.Coord.list(rec, pd.stemSnapV);
    result.blueScale = rec.coord(pd.blueScale);
    result.blueShift = rec.coord(pd.blueShift);
    result.blueFuzz = rec.coord(pd.blueFuzz);
    result.stdHW = rec.coord(pd.stdHW);
    result.stdVW = rec.coord(pd.stdVW);
    result.languageGroup = pd.languageGroup;
    result.expansionFactor = rec.coord(pd.expansionFactor);
    result.defaultWidthX = pd.defaultWidthX;
    result.nominalWidthX = pd.nominalWidthX;
    return result;
}

function rectifyCoordFontDict(rec: CoordRectifier, fd: Ot.Cff.FontDict) {
    const result = new Ot.Cff.FontDict();
    result.version = fd.version;
    result.notice = fd.notice;
    result.copyright = fd.copyright;
    result.fullName = fd.fullName;
    result.familyName = fd.familyName;
    result.weight = fd.weight;
    result.isFixedPitch = fd.isFixedPitch;
    result.italicAngle = fd.italicAngle;
    result.underlinePosition = fd.underlinePosition;
    result.underlineThickness = fd.underlineThickness;
    result.paintType = fd.paintType;
    result.strokeWidth = fd.strokeWidth;
    result.cidFontName = fd.cidFontName;
    result.cidFontVersion = fd.cidFontVersion;
    result.cidFontRevision = fd.cidFontRevision;
    result.cidFontType = fd.cidFontType;
    result.cidCount = fd.cidCount;

    if (fd.privateDict) {
        result.privateDict = rectifyCoordPrivateDict(rec, fd.privateDict);
    }
    if (fd.fontMatrix) {
        result.fontMatrix = {
            ...fd.fontMatrix,
            dx: rec.coord(fd.fontMatrix.dx),
            dy: rec.coord(fd.fontMatrix.dy)
        };
    }
    return result;
}
function rectifyGlyphCID(rec: GlyphReferenceRectifier, cid: Ot.Cff.CID) {
    const result = new Ot.Cff.CID();
    result.registry = cid.registry;
    result.ordering = cid.ordering;
    result.supplement = cid.supplement;
    if (cid.mapping) {
        cid.mapping = RectifyImpl.Glyph.comapSome(rec, cid.mapping);
    }
    return result;
}

export function rectifyCffTable(
    rg: GlyphReferenceRectifier,
    rc: CoordRectifier,
    table: Ot.Cff.Table
) {
    const result = new Ot.Cff.Table(table.version);
    result.postScriptFontName = table.postScriptFontName;
    result.topDict = rectifyCoordFontDict(rc, table.topDict);
    if (table.cid) result.cid = rectifyGlyphCID(rg, table.cid);
    if (table.fdArray) {
        result.fdArray = RectifyImpl.listAllT(rc, table.fdArray, rectifyCoordFontDict);
    }
    if (table.fdSelect) table.fdSelect = RectifyImpl.Glyph.mapSome(rg, table.fdSelect);
    return result;
}
