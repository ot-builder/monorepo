import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Maxp } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

export class MaxpStat implements OtGlyph.Stat.Sink {
    constructor(
        private readonly maxp: Maxp.Table,
        private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>
    ) {}

    // MAXP fields
    public maxPoints: UInt16 = 0;
    public maxContours: UInt16 = 0;
    public maxCompositePoints: UInt16 = 0;
    public maxCompositeContours: UInt16 = 0;
    public maxSizeOfInstructions: UInt16 = 0;
    public maxComponentElements: UInt16 = 0;
    public maxComponentDepth: UInt16 = 0;

    public setNumGlyphs(count: number): void {
        this.maxp.numGlyphs = count;
        if (this.outer) this.outer.setNumGlyphs(count);
    }
    public setMetric(
        gid: number,
        horizontal: OtGlyph.Metric,
        vertical: OtGlyph.Metric,
        extent: OtGlyph.Stat.BoundingBox
    ) {
        if (this.outer) this.outer.setMetric(gid, horizontal, vertical, extent);
    }
    public simpleGlyphStat(st: OtGlyph.Stat.SimpleGlyphStat) {
        this.maxPoints = Math.max(this.maxPoints, st.eigenPoints);
        this.maxContours = Math.max(this.maxContours, st.eigenContours);
        this.maxComponentDepth = Math.max(this.maxComponentDepth, st.depth);
        if (this.outer) this.outer.simpleGlyphStat(st);
    }
    public complexGlyphStat(st: OtGlyph.Stat.ComplexGlyphStat) {
        this.maxCompositePoints = Math.max(this.maxCompositePoints, st.totalPoints);
        this.maxCompositeContours = Math.max(this.maxCompositeContours, st.totalContours);
        this.maxComponentElements = Math.max(this.maxComponentElements, st.eigenReferences);
        this.maxComponentDepth = Math.max(this.maxComponentDepth, st.depth);
        if (this.outer) this.outer.complexGlyphStat(st);
    }
    public instructionsStat(size: number): void {
        this.maxSizeOfInstructions = Math.max(this.maxSizeOfInstructions, size);
        if (this.outer) this.outer.instructionsStat(size);
    }
    public settle() {
        if (this.outer) this.outer.settle();
    }
}
