import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Cff } from "@ot-builder/ft-glyphs";
import { CffCoGlyphs } from "@ot-builder/ft-glyphs/lib/store/cff";
import { Cff1Io, Cff2Io, CffCfg } from "@ot-builder/io-bin-cff";

import { ReadGlyphStoreImpl } from "../general/read";
import { WriteGlyphStoreImpl } from "../general/write";

export const ReadCffGlyphs: ReadGlyphStoreImpl<CffCfg, CffCoGlyphs> = {
    readGlyphs(sfnt, cfg, gOrd, ctx) {
        const bCff2 = sfnt.tables.get(Cff.Tag2);
        if (bCff2) return new BinaryView(bCff2).next(Cff2Io, cfg, gOrd, ctx.axes, ctx.coStat);

        const bCff1 = sfnt.tables.get(Cff.Tag1);
        if (bCff1) return new BinaryView(bCff1).next(Cff1Io, cfg, gOrd, ctx.coStat);

        throw Errors.Unreachable();
    }
};

export const WriteCffGlyphs: WriteGlyphStoreImpl<CffCfg, CffCoGlyphs> = {
    writeMetricVariance: true,
    writeGlyphs(sfnt, cfg, coGlyphs, gOrd, ctx) {
        const cff = coGlyphs.cff;
        if (cff.version > 1) {
            sfnt.add(
                Cff.Tag2,
                Frag.pack(Frag.from(Cff2Io, cff, gOrd, cfg, ctx.head, ctx.axes, ctx.stat))
            );
        } else {
            sfnt.add(Cff.Tag1, Frag.pack(Frag.from(Cff1Io, cff, gOrd, cfg, ctx.head, ctx.stat)));
        }
    }
};
