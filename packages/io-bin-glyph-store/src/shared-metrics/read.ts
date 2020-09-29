import { BinaryView } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { MetricBasicIo, MetricVarianceIo, VorgIo } from "@ot-builder/io-bin-metric";
import { MetricBasic, MetricVariance, Vorg } from "@ot-builder/ot-glyphs";
import { Maxp, MetricHead } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

export function readHMetric(
    sfnt: Sfnt,
    maxp: Maxp.Table,
    hhea: Data.Maybe<MetricHead.Table>,
    designSpace: Data.Maybe<OtVar.DesignSpace>
) {
    const bHmtx = sfnt.tables.get(MetricBasic.TagHmtx);
    const bHvar = sfnt.tables.get(MetricVariance.TagHvar);
    if (!hhea) throw Errors.MissingKeyTable(MetricHead.TagHhea);
    if (!bHmtx) throw Errors.MissingKeyTable(MetricBasic.TagHmtx);

    const hmtx = new BinaryView(bHmtx).next(MetricBasicIo, hhea, maxp);
    const hvar =
        designSpace && bHvar
            ? new BinaryView(bHvar).next(MetricVarianceIo, maxp, designSpace, false)
            : null;
    return { hhea, hmtx, hvar };
}

export function readVMetric(
    sfnt: Sfnt,
    maxp: Maxp.Table,
    vhea: Data.Maybe<MetricHead.Table>,
    designSpace: Data.Maybe<OtVar.DesignSpace>
) {
    const bVmtx = sfnt.tables.get(MetricBasic.TagVmtx);
    const bVvar = sfnt.tables.get(MetricVariance.TagVvar);
    const bVorg = sfnt.tables.get(Vorg.Tag);
    if (!vhea || !bVmtx) return null;

    const vmtx = new BinaryView(bVmtx).next(MetricBasicIo, vhea, maxp);
    const vorg = bVorg ? new BinaryView(bVorg).next(VorgIo) : null;
    const vvar =
        designSpace && bVvar
            ? new BinaryView(bVvar).next(MetricVarianceIo, maxp, designSpace, true)
            : null;
    return { vhea, vmtx, vvar, vorg };
}
