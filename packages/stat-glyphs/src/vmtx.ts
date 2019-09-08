import { MetricBasic, MetricVariance, OtGlyph, Vorg } from "@ot-builder/ft-glyphs";
import { Fvar, MetricHead } from "@ot-builder/ft-metadata";
import { Arith, Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { statLongMetricCount } from "./hmtx";

export class VmtxStat implements OtGlyph.Stat.Sink {
    // Table triplet
    public vmtx = new MetricBasic.Table();
    public vvar: Data.Maybe<MetricVariance.Table>;
    public vorg = new Vorg.Table();

    public minTopSideBearing = 0x7fff;
    public minBottomSideBearing = 0x7fff;
    public yMaxExtent = 0;

    constructor(
        private vhea: MetricHead.Table,
        fvar?: Data.Maybe<Fvar.Table>,
        private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>
    ) {
        if (fvar) this.vvar = new MetricVariance.Table(true);
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
        const stVOrg = Arith.Round.Coord(OtVar.Ops.originOf(vertical.start));
        const advance = OtVar.Ops.minus(vertical.start, vertical.end);
        const stTsb = stVOrg - Arith.Round.Coord(extent.yMax);
        const stAdv = Arith.Round.Offset(OtVar.Ops.originOf(advance));
        const stBsb = extent.yMin - (stVOrg - stAdv);

        if (stTsb < this.minTopSideBearing) this.minTopSideBearing = stTsb;
        if (stBsb < this.minBottomSideBearing) this.minBottomSideBearing = stBsb;
        if (stTsb + extent.yMax - extent.yMin > this.yMaxExtent) {
            this.yMaxExtent = stTsb + extent.yMax - extent.yMin;
        }
        this.vmtx.measures[gid] = new MetricBasic.Measure(stAdv, stTsb);
        this.vorg.vertOriginYMetrics[gid] = stVOrg;
        if (this.vvar) {
            this.vvar.measures[gid] = new MetricVariance.Measure(vertical.start, advance);
        }
        if (this.outer) this.outer.setMetric(gid, horizontal, vertical, extent);
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

    private statVorgFreq() {
        // fill
        for (let gid = 0; gid < this.vorg.vertOriginYMetrics.length; gid++) {
            const org = this.vorg.vertOriginYMetrics[gid];
            if (org == null) this.vorg.vertOriginYMetrics[gid] = this.vorg.defaultVertOriginY;
        }

        let freq: number[] = [];
        for (let gid = 0; gid < this.vorg.vertOriginYMetrics.length; gid++) {
            const org = this.vorg.vertOriginYMetrics[gid];
            if (org == null || org < 0) continue;
            freq[org] = (freq[org] || 0) + 1;
        }
        let maxFreq = 0,
            maxFreqVorg = 0;
        for (let org = 0; org < freq.length; org++) {
            const f = freq[org] || 0;
            if (f >= maxFreq) maxFreqVorg = org;
        }
        this.vorg.defaultVertOriginY = maxFreqVorg;
        for (let gid = 0; gid < this.vorg.vertOriginYMetrics.length; gid++) {
            const org = this.vorg.vertOriginYMetrics[gid];
            if (org === maxFreqVorg) this.vorg.vertOriginYMetrics[gid] = undefined;
        }
    }
    public settle() {
        if (this.outer) this.outer.settle();
        this.vhea.minStartSideBearing = this.minTopSideBearing;
        this.vhea.minEndSideBearing = this.minBottomSideBearing;
        this.vhea.maxExtent = this.yMaxExtent;
        statLongMetricCount(this.vhea, this.vmtx);
        this.statVorgFreq();
    }
}

export class VmtxCoStat implements OtGlyph.CoStat.Source {
    constructor(
        private vmtx: MetricBasic.Table,
        private vvar?: Data.Maybe<MetricVariance.Table>,
        private vorg?: Data.Maybe<Vorg.Table>,
        private outer?: Data.Maybe<OtGlyph.CoStat.Source>
    ) {}

    public getHMetric(gid: number, extent: Data.Maybe<OtGlyph.Stat.BoundingBox>) {
        if (this.outer) return this.outer.getHMetric(gid, extent);
        else return undefined;
    }
    public getVMetric(gid: number, extent: Data.Maybe<OtGlyph.Stat.BoundingBox>) {
        let start: OtVar.Value;
        if (!extent) start = 0;
        else start = extent.yMax + this.vmtx.measures[gid].startSideBearing;
        if (this.vorg) start = this.vorg.get(gid);
        if (this.vvar) start = OtVar.Ops.add(start, OtVar.Ops.removeOrigin(this.vvar.measures[gid].start));
        let end: OtVar.Value = OtVar.Ops.minus(
            start,
            OtVar.Ops.add(
                this.vmtx.measures[gid].advance,
                this.vvar ? OtVar.Ops.removeOrigin(this.vvar.measures[gid].advance) : 0
            )
        );
        return { start, end };
    }
}
