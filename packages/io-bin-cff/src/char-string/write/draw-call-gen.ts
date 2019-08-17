import { Cff, OtGlyph } from "@ot-builder/ft-glyphs";
import { OtVar, OV } from "@ot-builder/variance";

import { CffWriteContext } from "../../context/write";
import { CharStringOperator } from "../../interp/operator";

import { CffDrawCall, CffDrawCallRaw } from "./draw-call";

type CompileTimeMask = {
    at: OtGlyph.PointRef;
    isContour: boolean;
    flags: number[];
};

function byMaskPosition(a: CompileTimeMask, b: CompileTimeMask) {
    return OtGlyph.PointRef.compare(a.at, b.at);
}

class CffCodeGen {
    constructor(private readonly st: CffCodeGenState) {}

    private pushStemList(op: CharStringOperator, stemList: ReadonlyArray<OtGlyph.CffHintStem>) {
        if (!stemList.length) return;
        let current: OtVar.Value = 0;
        let args: OtVar.Value[] = [];
        for (let s of stemList) {
            const arg1 = OV.minus(s.start, current);
            const arg2 = OV.minus(s.end, s.start);
            current = s.end;
            args.push(arg1, arg2);
        }
        this.st.pushRawCall(new CffDrawCallRaw(args, op));
    }
    private makeCtMask(
        contour: boolean,
        mask: OtGlyph.CffHintMask,
        hints: OtGlyph.CffHint
    ): CompileTimeMask {
        const flags: number[] = [];
        for (const s of hints.hStems) {
            if (mask.maskH.has(s)) flags.push(1);
            else flags.push(0);
        }
        for (const s of hints.vStems) {
            if (mask.maskV.has(s)) flags.push(1);
            else flags.push(0);
        }
        return { at: mask.at, isContour: contour, flags };
    }

    public processHints(hints: OtGlyph.CffHint) {
        const hasMask =
            (hints.hintMasks.length || hints.counterMasks.length) &&
            (hints.hStems.length || hints.vStems.length);
        this.pushStemList(
            hasMask ? CharStringOperator.HStemHM : CharStringOperator.HStem,
            hints.hStems
        );
        this.pushStemList(
            hasMask ? CharStringOperator.VStemHM : CharStringOperator.VStem,
            hints.vStems
        );
        if (hasMask) {
            for (const mask of hints.hintMasks) {
                this.st.masks.push(this.makeCtMask(false, mask, hints));
            }
            for (const mask of hints.counterMasks) {
                this.st.masks.push(this.makeCtMask(true, mask, hints));
            }
            this.st.masks.sort(byMaskPosition);
        }
    }

    public processGeometry(geometries: Iterable<OtGlyph.Geometry>) {
        const gs = new CffGeometryHandler(this.st);
        for (const geom of geometries) {
            geom.transfer(gs);
        }
    }

    public addWidth(
        hMetric: OtGlyph.Metric,
        defaultWidthX: OtVar.Value,
        nominalWidthX: OtVar.Value
    ) {
        const width = OV.minus(hMetric.end, hMetric.start);
        if (OV.equal(width, defaultWidthX, 1 / 0x10000)) return;
        const arg = OV.minus(width, nominalWidthX);
        if (!this.st.rawDrawCalls.length) {
            this.st.pushRawCall(new CffDrawCallRaw([arg], CharStringOperator.EndChar));
        } else {
            this.st.rawDrawCalls[0] = new CffDrawCallRaw(
                [arg, ...this.st.rawDrawCalls[0].args],
                this.st.rawDrawCalls[0].operator,
                this.st.rawDrawCalls[0].flags
            );
        }
    }
}

class CffCodeGenState {
    // Compilation
    public rawDrawCalls: CffDrawCallRaw[] = [];
    public cx: OtVar.Value = 0;
    public cy: OtVar.Value = 0;
    private maskPr: OtGlyph.PointRefW = { geometry: 0, contour: 0, index: 0 };
    private maskIndex = 0;
    public masks: CompileTimeMask[] = [];

    public advance(geom: number, contour: number, knot: number) {
        if (geom) {
            this.maskPr.geometry += geom;
            this.maskPr.contour = 0;
            this.maskPr.index = 0;
        }
        if (contour) {
            this.maskPr.contour += contour;
            this.maskPr.index = 0;
        }
        this.maskPr.index += knot;
        while (
            this.maskIndex < this.masks.length &&
            OtGlyph.PointRef.compare(this.masks[this.maskIndex].at, this.maskPr) <= 0
        ) {
            const mask = this.masks[this.maskIndex];
            this.maskIndex += 1;
            if (mask.isContour) {
                this.pushRawCall(new CffDrawCallRaw([], CharStringOperator.CntrMask, mask.flags));
            } else {
                this.pushRawCall(new CffDrawCallRaw([], CharStringOperator.HintMask, mask.flags));
            }
        }
    }

    public pushRawCall(ir: CffDrawCallRaw) {
        this.rawDrawCalls.push(ir);
    }

    public getDrawCalls(ctx: CffWriteContext) {
        return CffDrawCall.charStringSeqFromRawSeq(ctx, this.rawDrawCalls);
    }

    // Stats
    public statContours = 0;
    public statPoints = 0;
    public bBoxStat = new OtGlyph.Stat.BoundingBoxBuilder();

    public addContourStat(nPoints: number) {
        this.statContours += 1;
        this.statPoints += nPoints;
    }

    public getStat(): OtGlyph.Stat.SimpleGlyphStat {
        return {
            eigenContours: this.statContours,
            eigenPoints: this.statPoints,
            extent: this.bBoxStat.getResult(),
            depth: 0
        };
    }
}

class CffGeometryHandler implements OtGlyph.GeometrySink {
    constructor(private readonly st: CffCodeGenState) {}
    public addReference() {}
    public addContourSet() {
        return new CffContourSetHandler(this.st);
    }
}

class CffContourSetHandler implements OtGlyph.ContourSink {
    constructor(private readonly st: CffCodeGenState) {}
    public begin() {
        this.st.advance(0, 0, 0);
    }
    public addContour() {
        return new CffContourHandler(this.st);
    }
    public end() {
        this.st.advance(1, 0, 0);
    }
}

// A contour handler holds a state machine that processes off-curve control knots knot-by-knot.
class CffContourHandler implements OtGlyph.PrimitiveSink {
    constructor(private readonly st: CffCodeGenState) {}

    // Internal states
    public knotsHandled = 0;
    public pendingKnots: OtGlyph.Point[] = [];
    public firstKnot: null | OtGlyph.Point = null;

    public begin() {
        this.st.advance(0, 0, 0);
    }
    public addControlKnot(knot: OtGlyph.Point) {
        if (!this.knotsHandled) this.firstKnot = knot;
        if (knot.kind === OtGlyph.PointType.Lead && this.pendingKnots.length === 0) {
            this.pendingKnots.push(knot);
        } else if (knot.kind === OtGlyph.PointType.Follow && this.pendingKnots.length === 1) {
            this.pendingKnots.push(knot);
        } else if (knot.kind === OtGlyph.PointType.Corner && this.pendingKnots.length === 2) {
            this.pushCurve(this.pendingKnots[0], this.pendingKnots[1], knot);
            this.pendingKnots.length = 0;
        } else {
            for (const pk of this.pendingKnots) this.pushCorner(pk);
            this.pendingKnots.length = 0;
            this.pushCorner(knot);
        }
        this.knotsHandled += 1;
    }
    private pushCorner(a: OtGlyph.Point) {
        this.st.bBoxStat.addPoint(OV.originOf(a.x), OV.originOf(a.y));
        const dx = OV.minus(a.x, this.st.cx);
        const dy = OV.minus(a.y, this.st.cy);
        this.st.cx = a.x;
        this.st.cy = a.y;
        if (!this.knotsHandled) {
            this.st.pushRawCall(new CffDrawCallRaw([dx, dy], CharStringOperator.RMoveTo));
        } else {
            this.st.pushRawCall(new CffDrawCallRaw([dx, dy], CharStringOperator.RLineTo));
        }
        this.st.advance(0, 0, 1);
    }
    private pushCurve(a: OtGlyph.Point, b: OtGlyph.Point, c: OtGlyph.Point) {
        this.st.bBoxStat.addBox(
            OtGlyph.Stat.bezierCurveBoundingBox(
                OV.originOf(this.st.cx),
                OV.originOf(this.st.cy),
                OV.originOf(a.x),
                OV.originOf(a.y),
                OV.originOf(b.x),
                OV.originOf(b.y),
                OV.originOf(c.x),
                OV.originOf(c.y)
            )
        );
        const dxA = OV.minus(a.x, this.st.cx);
        const dyA = OV.minus(a.y, this.st.cy);
        const dxB = OV.minus(b.x, a.x);
        const dyB = OV.minus(b.y, a.y);
        const dxC = OV.minus(c.x, b.x);
        const dyC = OV.minus(c.y, b.y);
        this.st.cx = c.x;
        this.st.cy = c.y;
        this.st.pushRawCall(
            new CffDrawCallRaw([dxA, dyA, dxB, dyB, dxC, dyC], CharStringOperator.RRCurveTo)
        );
        this.st.advance(0, 0, 3);
    }
    public end() {
        // Close contour
        this.st.addContourStat(this.knotsHandled);
        if (this.firstKnot) {
            this.addControlKnot({ ...this.firstKnot, kind: OtGlyph.PointType.Corner });
        }
        this.st.advance(0, 1, 0);
    }
}

export function codeGenGlyph(
    wCtx: CffWriteContext,
    gid: number,
    glyph: OtGlyph,
    pd?: Cff.PrivateDict
) {
    const st = new CffCodeGenState();
    const cg = new CffCodeGen(st);

    if (glyph.hints && glyph.hints instanceof OtGlyph.CffHint) cg.processHints(glyph.hints);
    cg.processGeometry(glyph.geometries);
    if (wCtx.version <= 1) {
        cg.addWidth(glyph.horizontal, pd ? pd.defaultWidthX : 0, pd ? pd.nominalWidthX : 0);
    }

    const calls = st.getDrawCalls(wCtx);
    const gStat = st.getStat();
    wCtx.stat.setMetric(gid, glyph.horizontal, glyph.vertical, gStat.extent);
    wCtx.stat.simpleGlyphStat(gStat);
    return calls;
}
