import { OtGlyph } from "@ot-builder/ot-glyphs";

import { ReadGlyphStoreImpl } from "../general/read";
import { WriteGlyphStoreImpl } from "../general/write";

export const SkipReadGlyphs: ReadGlyphStoreImpl<unknown, null> = {
    readGlyphs(sfnt, cfg, gOrd, ctx) {
        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            const hm = ctx.coStat.getHMetric(gid, null);
            if (hm) glyph.horizontal = hm;
            const vm = ctx.coStat.getVMetric(gid, null);
            if (vm) glyph.vertical = vm;
        }
        return null;
    }
};
export const SkipWriteGlyphs: WriteGlyphStoreImpl<unknown, null> = {
    writeMetricVariance: true,
    writeGlyphs(sink, cfg, coGlyphs, gOrd, ctx) {
        ctx.stat.setNumGlyphs(gOrd.length);
        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            ctx.stat.setMetric(
                gid,
                glyph.horizontal,
                glyph.vertical,
                OtGlyph.Stat.BoundingBox.Blank()
            );
        }
        ctx.stat.settle();
    }
};
