import { Cff, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Thunk } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffWriteContext } from "../../context/write";
import { CharStringOperator } from "../../interp/operator";

import { CffDrawCall, CffDrawCallRaw } from "./draw-call";

type CompileTimeMask = {
    at: OtGlyph.PointRef;
    isContour: boolean;
    flags: number[];
};

type AdvanceWidthHandler = {
    defaultWidthX: OtVar.Value;
    nominalWidthX: OtVar.Value;
};

class CffGlyphHandler implements OtGlyph.GlyphAlg<void> {
    constructor(
        private readonly widthHandler: null | AdvanceWidthHandler,
        private readonly st: CffCodeGenState
    ) {
        this.geometryAlgebra = new CffGeometryHandler(st);
        this.hintAlgebra = new CffHintHandler(st);
    }
    public geometryAlgebra: CffGeometryHandler;
    public hintAlgebra: CffHintHandler;

    public glyph(
        hMetric: OtGlyph.Metric,
        vMetric: OtGlyph.Metric,
        fGeom: Data.Maybe<Thunk<void>>,
        fHint: Data.Maybe<Thunk<void>>
    ) {
        if (fHint) fHint.force();
        if (fGeom) fGeom.force();

        if (this.widthHandler) {
            const width = OtVar.Ops.minus(hMetric.end, hMetric.start);
            if (OtVar.Ops.equal(width, this.widthHandler.defaultWidthX, 1 / 0x10000)) return;
            const arg = OtVar.Ops.minus(width, this.widthHandler.nominalWidthX);
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
}

function byMaskPosition(a: CompileTimeMask, b: CompileTimeMask) {
    return OtGlyph.PointRef.compare(a.at, b.at);
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

class CffHintHandler implements OtGlyph.HintAlg<void> {
    constructor(private readonly st: CffCodeGenState) {}

    public empty() {}
    public ttInstructions() {}
    public cffHint(h: OtGlyph.CffHintProps) {
        const hasMask =
            (h.hintMasks.length || h.counterMasks.length) && (h.hStems.length || h.vStems.length);
        this.pushStemList(
            hasMask ? CharStringOperator.HStemHM : CharStringOperator.HStem,
            h.hStems
        );
        this.pushStemList(
            hasMask ? CharStringOperator.VStemHM : CharStringOperator.VStem,
            h.vStems
        );
        if (hasMask) {
            for (const mask of h.hintMasks) {
                this.st.masks.push(this.makeCtMask(h, false, mask));
            }
            for (const mask of h.counterMasks) {
                this.st.masks.push(this.makeCtMask(h, true, mask));
            }
            this.st.masks.sort(byMaskPosition);
        }
    }

    private pushStemList(op: CharStringOperator, stemList: ReadonlyArray<OtGlyph.CffHintStem>) {
        if (!stemList.length) return;
        let current: OtVar.Value = 0;
        let args: OtVar.Value[] = [];
        for (let s of stemList) {
            const arg1 = OtVar.Ops.minus(s.start, current);
            const arg2 = OtVar.Ops.minus(s.end, s.start);
            current = s.end;
            args.push(arg1, arg2);
        }
        this.st.pushRawCall(new CffDrawCallRaw(args, op));
    }
    private makeCtMask(
        h: OtGlyph.CffHintProps,
        contour: boolean,
        mask: OtGlyph.CffHintMask
    ): CompileTimeMask {
        const flags: number[] = [];
        for (const s of h.hStems) {
            if (mask.maskH.has(s)) flags.push(1);
            else flags.push(0);
        }
        for (const s of h.vStems) {
            if (mask.maskV.has(s)) flags.push(1);
            else flags.push(0);
        }
        return { at: mask.at, isContour: contour, flags };
    }
}

class CffGeometryHandler implements OtGlyph.GeometryAlg<void> {
    constructor(private readonly st: CffCodeGenState) {}
    public empty() {}
    public ttReference() {}
    public geometryList() {}
    public contourSet(cs: OtGlyph.ContourSetProps) {
        this.st.advance(0, 0, 0);
        for (const contour of cs.contours) {
            const ch = new CffContourHandler(this.st);
            ch.begin();
            ch.visitContour(contour);
            ch.end();
        }
        this.st.advance(1, 0, 0);
    }
}

// A contour handler holds a state machine that processes off-curve control knots knot-by-knot.
class CffContourHandler {
    constructor(private readonly st: CffCodeGenState) {}

    // Internal states
    public knotsHandled = 0;
    public pendingKnots: OtGlyph.Point[] = [];
    public firstKnot: null | OtGlyph.Point = null;

    public begin() {
        this.st.advance(0, 0, 0);
    }
    public visitContour(c: OtGlyph.Contour) {
        for (const z of c) this.addKnotImpl(z);
    }

    private addKnotImpl(knot: OtGlyph.Point) {
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
        this.st.bBoxStat.addPoint(OtVar.Ops.originOf(a.x), OtVar.Ops.originOf(a.y));
        const dx = OtVar.Ops.minus(a.x, this.st.cx);
        const dy = OtVar.Ops.minus(a.y, this.st.cy);
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
                OtVar.Ops.originOf(this.st.cx),
                OtVar.Ops.originOf(this.st.cy),
                OtVar.Ops.originOf(a.x),
                OtVar.Ops.originOf(a.y),
                OtVar.Ops.originOf(b.x),
                OtVar.Ops.originOf(b.y),
                OtVar.Ops.originOf(c.x),
                OtVar.Ops.originOf(c.y)
            )
        );
        const dxA = OtVar.Ops.minus(a.x, this.st.cx);
        const dyA = OtVar.Ops.minus(a.y, this.st.cy);
        const dxB = OtVar.Ops.minus(b.x, a.x);
        const dyB = OtVar.Ops.minus(b.y, a.y);
        const dxC = OtVar.Ops.minus(c.x, b.x);
        const dyC = OtVar.Ops.minus(c.y, b.y);
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
            this.addKnotImpl({ ...this.firstKnot, kind: OtGlyph.PointType.Corner });
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
    const wh: null | AdvanceWidthHandler =
        wCtx.version > 1 ? null : pd || { defaultWidthX: 0, nominalWidthX: 0 };
    glyph.acceptGlyphAlgebra(new CffGlyphHandler(wh, st));

    const calls = st.getDrawCalls(wCtx);
    const gStat = st.getStat();
    wCtx.stat.setMetric(gid, glyph.horizontal, glyph.vertical, gStat.extent);
    wCtx.stat.simpleGlyphStat(gStat);
    return calls;
}
