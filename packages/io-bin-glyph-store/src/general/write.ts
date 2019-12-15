import { ImpLib } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Head, Maxp, OtFontMetadata } from "@ot-builder/ft-metadata";
import { SfntIoTableSink } from "@ot-builder/io-bin-sfnt";
import { Data } from "@ot-builder/prelude";
import { HeadExtendStat, HmtxStat, MaxpStat, Os2Stat, VmtxStat } from "@ot-builder/stat-glyphs";
import { OtVar } from "@ot-builder/variance";

import { GlyphStoreCfg } from "../cfg/glyph-store-cfg";
import { writeHMetrics, writeVMetrics } from "../shared-metrics/write";

export type GlyphStoreWriteImplCtx = {
    head: Head.Table;
    maxp: Maxp.Table;
    axes?: Data.Maybe<Data.Order<OtVar.Axis>>;
    stat: OtGlyph.Stat.Sink;
};

export interface WriteGlyphStoreImpl<C, T> {
    readonly writeMetricVariance: boolean;
    writeGlyphs(
        sink: SfntIoTableSink,
        cfg: C,
        coGlyphs: T,
        gOrd: Data.Order<OtGlyph>,
        ctx: GlyphStoreWriteImplCtx
    ): void;
}

export function writeGlyphStore<C, T>(
    // out
    sink: SfntIoTableSink,
    // in
    cfg: C & GlyphStoreCfg,
    // inOut
    md: OtFontMetadata,
    // in
    coGlyphs: T,
    gOrd: Data.Order<OtGlyph>,
    cb: WriteGlyphStoreImpl<C, T>
) {
    const { head, maxp, fvar, os2, hhea, vhea } = md;
    const axes = fvar ? ImpLib.Order.fromList("Axes", fvar.axes) : null;
    // stat stages
    const statHead = new HeadExtendStat(head);
    const statMaxp = new MaxpStat(maxp, statHead);
    let stat: OtGlyph.Stat.Sink = statMaxp;
    const statOs2 = os2 && cfg.glyphStore.statOs2XAvgCharWidth ? new Os2Stat(os2, stat) : null;
    if (statOs2) stat = statOs2;
    const statHmtx = hhea ? new HmtxStat(hhea, md.head, fvar, stat) : null;
    if (statHmtx) stat = statHmtx;
    const statVmtx = vhea ? new VmtxStat(vhea, fvar, stat) : null;
    if (statVmtx) stat = statVmtx;

    // Build glyphs and co-glyphs
    stat.setNumGlyphs(gOrd.length);
    cb.writeGlyphs(sink, cfg, coGlyphs, gOrd, { head, maxp, axes, stat });
    stat.settle();

    // Write metrics
    writeHMetrics(sink, cb.writeMetricVariance, hhea, statHmtx, gOrd, axes);
    writeVMetrics(sink, cb.writeMetricVariance, vhea, statVmtx, gOrd, axes);
}
