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
    axes: Data.Maybe<Data.Order<OtVar.Axis>>
) {
    if (!hhea || !statHmtx) return;

    sink.add(MetricBasic.TagHmtx, Frag.pack(Frag.from(MetricBasicIo, statHmtx.hmtx, hhea, gOrd)));
    if (axes && writeMetricVariance && statHmtx.hvar) {
        const hvarEmpty = new ImpLib.State(true);
        sink.add(
            MetricVariance.TagHvar,
            Frag.pack(Frag.from(MetricVarianceIo, statHmtx.hvar, axes, hvarEmpty)),
            hvarEmpty
        );
    }
}

export function writeVMetrics(
    sink: SfntIoTableSink,
    writeMetricVariance: boolean,
    vhea: Data.Maybe<MetricHead.Table>,
    statVmtx: VmtxStat | null,
    gOrd: Data.Order<OtGlyph>,
    axes: Data.Maybe<Data.Order<OtVar.Axis>>
) {
    if (!vhea || !statVmtx) return;

    sink.add(MetricBasic.TagVmtx, Frag.pack(Frag.from(MetricBasicIo, statVmtx.vmtx, vhea, gOrd)));
    sink.add(Vorg.Tag, Frag.pack(Frag.from(VorgIo, statVmtx.vorg)));
    if (axes && writeMetricVariance && statVmtx.vvar) {
        const vvarEmpty = new ImpLib.State(true);
        sink.add(
            MetricVariance.TagVvar,
            Frag.pack(Frag.from(MetricVarianceIo, statVmtx.vvar, axes, vvarEmpty)),
            vvarEmpty
        );
    }
}
