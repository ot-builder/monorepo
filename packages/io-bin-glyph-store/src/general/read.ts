import { Config } from "@ot-builder/cfg-log";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Head, Maxp, OtFontIoMetadata } from "@ot-builder/ft-metadata";
import { Sfnt } from "@ot-builder/ft-sfnt";
import { Data } from "@ot-builder/prelude";
import { HmtxCoStat, VmtxCoStat } from "@ot-builder/stat-glyphs";
import { OtVar } from "@ot-builder/variance";

import { GlyphStoreCfg } from "../cfg/glyph-store-cfg";
import { readHMetric, readVMetric } from "../shared-metrics/read";

export type GlyphStoreReadImplCtx = {
    head: Head.Table;
    maxp: Maxp.Table;
    axes?: Data.Maybe<Data.Order<OtVar.Axis>>;
    coStat: OtGlyph.CoStat.Source;
    hMetricVariable?: boolean;
    vMetricVariable?: boolean;
};

export interface ReadGlyphStoreImpl<C, T> {
    readGlyphs(
        sfnt: Sfnt,
        cfg: Config<C>,
        gOrd: Data.Order<OtGlyph>,
        ctx: GlyphStoreReadImplCtx
    ): T;
}

export function readGlyphStore<C, T, S extends Data.OrderStore<OtGlyph>>(
    sfnt: Sfnt,
    cfg: Config<C & GlyphStoreCfg>,
    md: OtFontIoMetadata,
    gsf: Data.OrderStoreFactory<OtGlyph, S>,
    cb: ReadGlyphStoreImpl<C, T>
) {
    const { head, maxp, fvar, hhea, vhea } = md;
    const axes = fvar ? Data.Order.fromList("Axes", fvar.axes) : null;

    const hor = readHMetric(sfnt, maxp, hhea, axes);
    const hmStartsAtZero = !!(head.flags & Head.Flags.LeftSidebearingAtX0);
    let coStat: OtGlyph.CoStat.Source = new HmtxCoStat(hmStartsAtZero, hor.hmtx, hor.hvar);
    const ver = readVMetric(sfnt, maxp, vhea, axes);
    if (ver) coStat = new VmtxCoStat(ver.vmtx, ver.vvar, ver.vorg, coStat);

    const glyphs = gsf.createStoreFromSize(maxp.numGlyphs);
    const gOrd = glyphs.decideOrder();
    const coGlyphs = cb.readGlyphs(sfnt, cfg, gOrd, {
        head,
        maxp,
        axes,
        coStat,
        hMetricVariable: !!hor.hvar,
        vMetricVariable: !!(ver && ver.vvar)
    });

    return { glyphs, gOrd, coGlyphs };
}
