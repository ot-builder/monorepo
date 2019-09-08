import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Os2 } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export class Os2Stat implements OtGlyph.Stat.Sink {
    constructor(private os2: Os2.Table, private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>) {}

    private metricsCount: number = 0;
    private metricsSum: number = 0;

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
        const adv = OtVar.Ops.originOf(horizontal.end) - OtVar.Ops.originOf(horizontal.start);
        if (adv > 0) {
            this.metricsCount += 1;
            this.metricsSum += adv;
        }
    }
    public simpleGlyphStat(st: OtGlyph.Stat.SimpleGlyphStat) {
        if (this.outer) this.outer.simpleGlyphStat(st);
    }
    public complexGlyphStat(st: OtGlyph.Stat.ComplexGlyphStat) {
        if (this.outer) this.outer.complexGlyphStat(st);
    }
    public instructionsStat(size: number): void {
        if (this.outer) this.outer.instructionsStat(size);
    }
    public settle() {
        if (this.outer) this.outer.settle();
        if (this.metricsCount > 0) {
            this.os2.xAvgCharWidth = Math.round(this.metricsSum / this.metricsCount);
        } else {
            this.os2.xAvgCharWidth = 0;
        }
    }
}
