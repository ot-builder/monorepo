import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph/index";

export namespace OtGlyphStat {
    // Bounding box

    export class BoundingBox {
        constructor(
            public xMin: number,
            public xMax: number,
            public yMin: number,
            public yMax: number
        ) {}
        public static Blank(): BoundingBox {
            return new BoundingBox(0, 0, 0, 0);
        }
    }

    export class BoundingBoxBuilder {
        private box: BoundingBox | null = null;
        public addPoint(x: number, y: number) {
            if (!this.box) {
                this.box = new BoundingBox(
                    Math.floor(x),
                    Math.ceil(x),
                    Math.floor(y),
                    Math.ceil(y)
                );
            } else {
                this.box.xMin = Math.min(this.box.xMin, Math.floor(x));
                this.box.xMax = Math.max(this.box.xMax, Math.ceil(x));
                this.box.yMin = Math.min(this.box.yMin, Math.floor(y));
                this.box.yMax = Math.max(this.box.yMax, Math.ceil(y));
            }
        }
        public addBox(box: null | BoundingBox) {
            if (!box) return;
            this.addPoint(box.xMin, box.yMin);
            this.addPoint(box.xMax, box.yMax);
        }

        public getResultOpt() {
            return this.box;
        }
        public getResult() {
            return this.box || BoundingBox.Blank();
        }
    }

    export function evalBezier(x0: number, x1: number, x2: number, x3: number, t: number) {
        const mt = 1 - t;
        return mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    }

    export function bezierCurveBoundingBox(
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        x3: number,
        y3: number
    ) {
        let tValues = [],
            a,
            b,
            c,
            t,
            t1,
            t2,
            b2ac,
            sqrtB2AC;
        for (let extremaIndex = 0; extremaIndex < 2; ++extremaIndex) {
            if (extremaIndex === 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (Math.abs(a) < 1e-12) {
                if (Math.abs(b) < 1e-12) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tValues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            if (b2ac < 0) {
                if (Math.abs(b2ac) < 1e-12) {
                    t = -b / (2 * a);
                    if (0 < t && t < 1) {
                        tValues.push(t);
                    }
                }
                continue;
            }
            sqrtB2AC = Math.sqrt(b2ac);
            t1 = (-b + sqrtB2AC) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tValues.push(t1);
            }
            t2 = (-b - sqrtB2AC) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tValues.push(t2);
            }
        }

        const st = new BoundingBoxBuilder();
        let index = tValues.length;
        while (index--) {
            t = tValues[index];
            st.addPoint(evalBezier(x0, x1, x2, x3, t), evalBezier(y0, y1, y2, y3, t));
        }
        st.addPoint(x0, y0);
        st.addPoint(x3, y3);
        return st.getResultOpt();
    }

    // Glyph stat
    export interface SimpleGlyphStat {
        eigenContours: number;
        eigenPoints: number;
        extent: BoundingBox;
        depth: number;
    }
    export interface ComplexGlyphStat extends SimpleGlyphStat {
        eigenReferences: number;
        totalContours: number;
        totalPoints: number;
    }

    // Stat sink
    export interface Sink {
        setNumGlyphs(count: number): void;
        setMetric(
            gid: number,
            horizontal: GeneralGlyph.Metric.T<OtVar.Value>,
            vertical: GeneralGlyph.Metric.T<OtVar.Value>,
            extent: BoundingBox
        ): void;
        simpleGlyphStat(stat: SimpleGlyphStat): void;
        complexGlyphStat(stat: ComplexGlyphStat): void;
        instructionsStat(size: number): void;
        settle(): void;
    }

    export class Forward implements Sink {
        constructor(private readonly outer?: Data.Maybe<Sink>) {}
        public setMetric(
            gid: number,
            horizontal: GeneralGlyph.Metric.T<OtVar.Value>,
            vertical: GeneralGlyph.Metric.T<OtVar.Value>,
            extent: BoundingBox
        ) {
            if (this.outer) this.outer.setMetric(gid, horizontal, vertical, extent);
        }
        public setNumGlyphs(count: number): void {
            if (this.outer) this.outer.setNumGlyphs(count);
        }
        public simpleGlyphStat(st: SimpleGlyphStat) {
            if (this.outer) this.outer.simpleGlyphStat(st);
        }
        public complexGlyphStat(st: ComplexGlyphStat) {
            if (this.outer) this.outer.complexGlyphStat(st);
        }
        public instructionsStat(size: number): void {
            if (this.outer) this.outer.instructionsStat(size);
        }
        public settle() {
            if (this.outer) this.outer.settle();
        }
    }
}
