import { MetricBasic, MetricVariance, OtGlyph } from "@ot-builder/ft-glyphs";
import { Fvar, Head, MetricHead } from "@ot-builder/ft-metadata";
import { Arith, Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export class HmtxStat implements OtGlyph.Stat.Sink {
    // Table triplet
    public hmtx = new MetricBasic.Table();
    public hvar: Data.Maybe<MetricVariance.Table>;

    public minLeftSideBearing = 0x7fff;
    public minRightSideBearing = 0x7fff;
    public xMaxExtent = 0;

    public hOrgStartAtZero = true;

    constructor(
        private hhea: MetricHead.Table,
        private head: Head.Table,
        fvar?: Data.Maybe<Fvar.Table>,
        private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>
    ) {
        if (fvar) this.hvar = new MetricVariance.Table(false);
    }
    public setNumGlyphs(count: number): void {
        if (this.outer) this.outer.setNumGlyphs(count);
    }
    public setMetric(
        gid: number,
        horizontal: OtGlyph.Metric,
        vertical: OtGlyph.Metric,
        extent: OtGlyph.Stat.BoundingBox
    ) {
        const hOrg = this.hvar ? 0 : horizontal.start;
        const stHOrg = Arith.Round.Coord(OtVar.Ops.originOf(hOrg));
        const advance = OtVar.Ops.minus(horizontal.end, hOrg);
        const stLsb = Arith.Round.Coord(extent.xMin) - stHOrg;
        const stAdv = Arith.Round.Offset(OtVar.Ops.originOf(advance));
        const stRsb = stHOrg + stAdv - Arith.Round.Coord(extent.xMax);

        if (stLsb < this.minLeftSideBearing) this.minLeftSideBearing = stLsb;
        if (stRsb < this.minRightSideBearing) this.minRightSideBearing = stRsb;
        if (stLsb + extent.xMax - extent.xMin > this.xMaxExtent) {
            this.xMaxExtent = stLsb + extent.xMax - extent.xMin;
        }
        this.hmtx.measures[gid] = new MetricBasic.Measure(stAdv, stLsb);
        if (this.hvar) {
            this.hvar.measures[gid] = new MetricVariance.Measure(hOrg, advance);
        }
        if (this.outer) this.outer.setMetric(gid, horizontal, vertical, extent);
        if (stHOrg) this.hOrgStartAtZero = false;
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
        this.hhea.minStartSideBearing = this.minLeftSideBearing;
        this.hhea.minEndSideBearing = this.minRightSideBearing;
        this.hhea.maxExtent = this.xMaxExtent;
        statLongMetricCount(this.hhea, this.hmtx);
        this.head.flags &= ~Head.Flags.LeftSidebearingAtX0;
        this.head.flags |= this.hOrgStartAtZero ? Head.Flags.LeftSidebearingAtX0 : 0;
    }
}

export function statLongMetricCount(hea: MetricHead.Table, mtx: MetricBasic.Table) {
    hea.numberOfLongMetrics = mtx.measures.length;
    for (let gid = mtx.measures.length; gid-- > 2; ) {
        if (mtx.measures[gid - 1].advance === mtx.measures[gid].advance) {
            hea.numberOfLongMetrics--;
        } else {
            break;
        }
    }
}

export class HmtxCoStat implements OtGlyph.CoStat.Source {
    constructor(
        private alwaysStartAtZero: boolean,
        private hmtx: MetricBasic.Table,
        private hvar?: Data.Maybe<MetricVariance.Table>,
        private outer?: Data.Maybe<OtGlyph.CoStat.Source>
    ) {}

    public getHMetric(gid: number, extent: Data.Maybe<OtGlyph.Stat.BoundingBox>) {
        let start: OtVar.Value;
        if (this.alwaysStartAtZero || !extent) {
            start = 0;
        } else {
            start = extent.xMin - this.hmtx.measures[gid].startSideBearing;
            if (this.hvar) start = OtVar.Ops.add(start, OtVar.Ops.removeOrigin(this.hvar.measures[gid].start));
        }
        let end: OtVar.Value = OtVar.Ops.add(
            start,
            OtVar.Ops.add(
                this.hmtx.measures[gid].advance,
                this.hvar ? OtVar.Ops.removeOrigin(this.hvar.measures[gid].advance) : 0
            )
        );
        return { start, end };
    }
    public getVMetric(gid: number, extent: Data.Maybe<OtGlyph.Stat.BoundingBox>) {
        if (this.outer) return this.outer.getVMetric(gid, extent);
        else return undefined;
    }
}
