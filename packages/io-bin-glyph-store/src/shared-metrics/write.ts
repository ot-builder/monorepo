import { Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { MetricBasic, MetricVariance, OtGlyph, Vorg } from "@ot-builder/ft-glyphs";
import { Fvar, MetricHead } from "@ot-builder/ft-metadata";
import { MetricBasicIo, MetricVarianceIo, VorgIo } from "@ot-builder/io-bin-metric";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { HmtxStat, VmtxStat } from "@ot-builder/stat-glyphs";
import { OtVar } from "@ot-builder/variance";

export function writeHMetrics(
    sink: SfntIoTableSink,
    writeMetricVariance: boolean,
    hhea: Data.Maybe<MetricHead.Table>,
    statHmtx: Data.Maybe<HmtxStat>,
    gOrd: Data.Order<OtGlyph>,
    designSpace: Data.Maybe<OtVar.DesignSpace>
) {
    if (!hhea || !statHmtx) return;

    sink.add(MetricBasic.TagHmtx, Frag.pack(Frag.from(MetricBasicIo, statHmtx.hmtx, hhea, gOrd)));
    if (designSpace && writeMetricVariance && statHmtx.hvar) {
        const hvarEmpty = new ImpLib.State(true);
        const buf = Frag.packFrom(MetricVarianceIo, statHmtx.hvar, designSpace, hvarEmpty);
        if (!hvarEmpty.get()) sink.add(MetricVariance.TagHvar, buf);
    }
}

export function writeVMetrics(
    sink: SfntIoTableSink,
    writeMetricVariance: boolean,
    vhea: Data.Maybe<MetricHead.Table>,
    statVmtx: VmtxStat | null,
    gOrd: Data.Order<OtGlyph>,
    designSpace: Data.Maybe<OtVar.DesignSpace>
) {
    if (!vhea || !statVmtx) return;

    sink.add(MetricBasic.TagVmtx, Frag.pack(Frag.from(MetricBasicIo, statVmtx.vmtx, vhea, gOrd)));
    sink.add(Vorg.Tag, Frag.pack(Frag.from(VorgIo, statVmtx.vorg)));
    if (designSpace && writeMetricVariance && statVmtx.vvar) {
        const vvarEmpty = new ImpLib.State(true);
        const buf = Frag.packFrom(MetricVarianceIo, statVmtx.vvar, designSpace, vvarEmpty);
        if (!vvarEmpty.get()) sink.add(MetricVariance.TagVvar, buf);
    }
}
