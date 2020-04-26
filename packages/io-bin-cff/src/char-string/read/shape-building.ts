import { OtGlyph } from "@ot-builder/ot-glyphs";
import { OtVar } from "@ot-builder/variance";

import { CffCharStringDataSink } from "./interpreter";

export class CffGlyphBuilder implements CffCharStringDataSink {
    constructor(readonly glyph: OtGlyph) {}
    public stemQuantity: number = 0;
    public transient: OtVar.Value[] = [];

    private hints = new OtGlyph.CffHint();
    private contours: OtGlyph.Point[][] = [];
    private currentContour: OtGlyph.Point[] = [];

    public setWidth(x: OtVar.Value) {
        this.glyph.horizontal = { start: 0, end: x };
    }
    public addStemHint(isVertical: boolean, startEdge: OtVar.Value, endEdge: OtVar.Value) {
        if (isVertical) {
            this.hints.vStems.push(OtGlyph.CffHint.createStem(startEdge, endEdge));
        } else {
            this.hints.hStems.push(OtGlyph.CffHint.createStem(startEdge, endEdge));
        }
    }
    public addHintMask(isCounterMask: boolean, flags: number[]) {
        const ssHorizontal = new Set<OtGlyph.CffHintStem>();
        const ssVertical = new Set<OtGlyph.CffHintStem>();
        for (let sid = 0; sid < this.stemQuantity; sid++) {
            const masked = flags[sid];
            if (sid < this.hints.hStems.length) {
                if (masked) ssHorizontal.add(this.hints.hStems[sid]);
            } else {
                if (masked) ssVertical.add(this.hints.hStems[sid - this.hints.hStems.length]);
            }
        }
        const hm = OtGlyph.CffHint.createMask(
            {
                geometry: 0,
                contour: this.contours.length,
                index: this.currentContour.length
            },
            ssHorizontal,
            ssVertical
        );
        if (isCounterMask) {
            this.hints.counterMasks.push(hm);
        } else {
            this.hints.hintMasks.push(hm);
        }
    }
    private cx: OtVar.Value = 0;
    private cy: OtVar.Value = 0;

    private flushContour() {
        if (this.currentContour.length) {
            this.contours.push(this.currentContour);
        }
    }
    public startContour() {
        this.flushContour();
        this.currentContour = [];
    }
    public lineTo(x: OtVar.Value, y: OtVar.Value) {
        this.cx = OtVar.Ops.add(this.cx, x);
        this.cy = OtVar.Ops.add(this.cy, y);
        this.currentContour.push(OtGlyph.Point.create(this.cx, this.cy, OtGlyph.PointType.Corner));
    }

    public curveTo(
        x1: OtVar.Value,
        y1: OtVar.Value,
        x2: OtVar.Value,
        y2: OtVar.Value,
        x3: OtVar.Value,
        y3: OtVar.Value
    ) {
        const cx1 = OtVar.Ops.add(this.cx, x1);
        const cy1 = OtVar.Ops.add(this.cy, y1);
        const cx2 = OtVar.Ops.add(cx1, x2);
        const cy2 = OtVar.Ops.add(cy1, y2);
        const cx3 = OtVar.Ops.add(cx2, x3);
        const cy3 = OtVar.Ops.add(cy2, y3);
        this.cx = cx3;
        this.cy = cy3;
        this.currentContour.push(OtGlyph.Point.create(cx1, cy1, OtGlyph.PointType.Lead));
        this.currentContour.push(OtGlyph.Point.create(cx2, cy2, OtGlyph.PointType.Follow));
        this.currentContour.push(OtGlyph.Point.create(cx3, cy3, OtGlyph.PointType.Corner));
    }

    public getRandom() {
        return 0;
    }

    public endChar() {
        this.startContour();
        if (this.contours.length) this.glyph.geometry = new OtGlyph.ContourSet(this.contours);
        this.glyph.hints = this.hints;
    }
}
