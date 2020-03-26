import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Head } from "@ot-builder/ot-metadata";
import { Data } from "@ot-builder/prelude";

export class HeadExtendStat implements OtGlyph.Stat.Sink {
    public fontBBox = new OtGlyph.Stat.BoundingBoxBuilder();
    constructor(
        private readonly head: Head.Table,
        private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>
    ) {}
    public setNumGlyphs(count: number): void {
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
        this.fontBBox.addBox(st.extent);
        if (this.outer) this.outer.simpleGlyphStat(st);
    }
    public complexGlyphStat(st: OtGlyph.Stat.ComplexGlyphStat) {
        this.fontBBox.addBox(st.extent);
        if (this.outer) this.outer.complexGlyphStat(st);
    }
    public instructionsStat(size: number): void {
        if (this.outer) this.outer.instructionsStat(size);
    }
    public settle() {
        const bb = this.fontBBox.getResult();
        this.head.xMin = bb.xMin;
        this.head.xMax = bb.xMax;
        this.head.yMin = bb.yMin;
        this.head.yMax = bb.yMax;
        if (this.outer) this.outer.settle();
    }
}
