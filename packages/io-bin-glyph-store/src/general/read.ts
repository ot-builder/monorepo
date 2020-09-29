import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Head, Maxp, OtFontIoMetadata } from "@ot-builder/ot-metadata";
import { Sfnt } from "@ot-builder/ot-sfnt";
import { Data } from "@ot-builder/prelude";
import { HmtxCoStat, VmtxCoStat } from "@ot-builder/stat-glyphs";
import { OtVar } from "@ot-builder/variance";

import { GlyphStoreCfg } from "../cfg/glyph-store-cfg";
import { readHMetric, readVMetric } from "../shared-metrics/read";

export type GlyphStoreReadImplCtx = {
    head: Head.Table;
    maxp: Maxp.Table;
    designSpace?: Data.Maybe<OtVar.DesignSpace>;
    coStat: OtGlyph.CoStat.Source;
    hMetricVariable?: boolean;
    vMetricVariable?: boolean;
};

export interface ReadGlyphStoreImpl<C, T> {
    readGlyphs(sfnt: Sfnt, cfg: C, gOrd: Data.Order<OtGlyph>, ctx: GlyphStoreReadImplCtx): T;
}

export function readGlyphStore<C, T, S extends Data.OrderStore<OtGlyph>>(
    sfnt: Sfnt,
    cfg: C & GlyphStoreCfg,
    md: OtFontIoMetadata,
    gsf: Data.OrderStoreFactoryWithDefault<OtGlyph, S>,
    cb: ReadGlyphStoreImpl<C, T>
) {
    const { head, maxp, fvar, hhea, vhea } = md;
    const designSpace = fvar ? fvar.getDesignSpace() : null;

    const hor = readHMetric(sfnt, maxp, hhea, designSpace);
    const hmStartsAtZero = !!(head.flags & Head.Flags.LeftSidebearingAtX0);
    let coStat: OtGlyph.CoStat.Source = new HmtxCoStat(hmStartsAtZero, hor.hmtx, hor.hvar);
    const ver = readVMetric(sfnt, maxp, vhea, designSpace);
    if (ver) coStat = new VmtxCoStat(ver.vmtx, ver.vvar, ver.vorg, coStat);

    const glyphs = gsf.createStoreFromSize(maxp.numGlyphs);
    const gOrd = glyphs.decideOrder();
    const coGlyphs = cb.readGlyphs(sfnt, cfg, gOrd, {
        head,
        maxp,
        designSpace: designSpace,
        coStat,
        hMetricVariable: !!hor.hvar,
        vMetricVariable: !!(ver && ver.vvar)
    });

    return { glyphs, gOrd, coGlyphs };
}
