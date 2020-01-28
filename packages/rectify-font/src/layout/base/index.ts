import * as Ot from "@ot-builder/font";
import {
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier,
    PointAttachmentRectifyManner
} from "../../interface";
import { RectifyImpl } from "../../shared";

interface BaseRectifyFn {
    baseCoord(lc: Ot.Base.Coord): Ot.Base.Coord;
}

function rectifyBaseCoordCoord(rec: CoordRectifier, lc: Ot.Base.Coord): Ot.Base.Coord {
    return { ...lc, at: rec.coord(lc.at) };
}

function rectifyBaseCoordGlyph(rec: GlyphReferenceRectifier, lc: Ot.Base.Coord): Ot.Base.Coord {
    if (!lc.pointAttachment) return lc;
    const g1 = rec.glyphRef(lc.pointAttachment.glyph);
    if (!g1) return { ...lc, pointAttachment: null };
    else return { ...lc, pointAttachment: { ...lc.pointAttachment, glyph: g1 } };
}

function rectifyBaseCoordPointAttach(
    rec: PointAttachmentRectifier,
    lc: Ot.Base.Coord,
    horizontal: boolean
): Ot.Base.Coord {
    if (!lc.pointAttachment) return lc;

    const desired = RectifyImpl.getGlyphPoints(lc.pointAttachment.glyph)[
        lc.pointAttachment.pointIndex
    ];
    if (!desired) return { ...lc, pointAttachment: null };

    const accept = horizontal
        ? rec.acceptOffset(desired, { x: desired.x, y: lc.at })
        : rec.acceptOffset(desired, { x: lc.at, y: desired.y });
    if (horizontal ? accept.y : accept.x) return lc;

    switch (rec.manner) {
        case PointAttachmentRectifyManner.TrustAttachment:
            if (horizontal) return { ...lc, at: desired.y };
            else return { ...lc, at: desired.x };
        case PointAttachmentRectifyManner.TrustCoordinate:
            return { ...lc, pointAttachment: null };
    }
}

function rectifyBaseCoord(fn: BaseRectifyFn, lc: Ot.Base.Coord) {
    return fn.baseCoord(lc);
}

function rectifyMinMaxValue(fn: BaseRectifyFn, lc: Ot.Base.MinMaxValue): Ot.Base.MinMaxValue {
    return {
        minCoord: RectifyImpl.maybeT(fn, lc.minCoord, rectifyBaseCoord),
        maxCoord: RectifyImpl.maybeT(fn, lc.maxCoord, rectifyBaseCoord)
    };
}

function rectifyMinMaxTable(fn: BaseRectifyFn, mm: Ot.Base.MinMaxTable) {
    return new Ot.Base.MinMaxTable(
        rectifyMinMaxValue(fn, mm.defaultMinMax),
        RectifyImpl.mapSomeT(fn, mm.featMinMax, RectifyImpl.Id, rectifyMinMaxValue)
    );
}

function rectifyBaseValues(fn: BaseRectifyFn, bv: Ot.Base.BaseValues) {
    return new Ot.Base.BaseValues(
        bv.defaultBaselineIndex,
        RectifyImpl.mapSomeT(fn, bv.baseValues, RectifyImpl.Id, rectifyBaseCoord)
    );
}

function rectifyScript(fn: BaseRectifyFn, sc: Ot.Base.Script) {
    const s2 = new Ot.Base.Script();
    if (sc.baseValues) s2.baseValues = rectifyBaseValues(fn, sc.baseValues);
    if (sc.defaultMinMax) s2.defaultMinMax = rectifyMinMaxTable(fn, sc.defaultMinMax);
    if (sc.baseLangSysRecords) {
        s2.baseLangSysRecords = RectifyImpl.mapSomeT(
            fn,
            sc.baseLangSysRecords,
            RectifyImpl.Id,
            rectifyMinMaxTable
        );
    }
    return s2;
}

function rectifyAxisTable(fn: BaseRectifyFn, at: Ot.Base.AxisTable) {
    const ret = new Ot.Base.AxisTable();
    ret.baselineTags = at.baselineTags;
    ret.scripts = RectifyImpl.mapSomeT(fn, at.scripts, RectifyImpl.Id, rectifyScript);
    return ret;
}

export function rectifyBaseTableCoord(
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    at: Ot.Base.Table
) {
    const ret = new Ot.Base.Table();
    const fnH: BaseRectifyFn = {
        baseCoord: c =>
            rectifyBaseCoordPointAttach(recPA, rectifyBaseCoordCoord(recCoord, c), true)
    };
    const fnV: BaseRectifyFn = {
        baseCoord: c =>
            rectifyBaseCoordPointAttach(recPA, rectifyBaseCoordCoord(recCoord, c), false)
    };
    if (at.horizontal) ret.horizontal = rectifyAxisTable(fnH, at.horizontal);
    if (at.vertical) ret.vertical = rectifyAxisTable(fnV, at.vertical);
    return ret;
}
export function rectifyBaseTableGlyphs(rec: GlyphReferenceRectifier, at: Ot.Base.Table) {
    const ret = new Ot.Base.Table();
    const fn: BaseRectifyFn = { baseCoord: c => rectifyBaseCoordGlyph(rec, c) };
    if (at.horizontal) ret.horizontal = rectifyAxisTable(fn, at.horizontal);
    if (at.vertical) ret.vertical = rectifyAxisTable(fn, at.vertical);
    return ret;
}
