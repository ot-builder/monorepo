import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Cvt, Fpgm, Prep, TtfCoGlyphs } from "@ot-builder/ft-glyphs";
import {
    CvarIo,
    CvtIo,
    FpgmIo,
    Glyf,
    Gvar,
    Loca,
    PrepIo,
    rectifyGlyphOrder,
    TtfCfg
} from "@ot-builder/io-bin-ttf";

import { ReadGlyphStoreImpl } from "../general/read";
import { WriteGlyphStoreImpl } from "../general/write";

export const ReadTtfGlyphs: ReadGlyphStoreImpl<TtfCfg, TtfCoGlyphs> = {
    readGlyphs(sfnt, cfg, gOrd, ctx) {
        const bLoca = sfnt.tables.get(Loca.Tag);
        const bGlyf = sfnt.tables.get(Glyf.Tag);
        if (!bLoca) throw Errors.MissingKeyTable(Loca.Tag);
        if (!bGlyf) throw Errors.MissingKeyTable(Glyf.Tag);
        const loca = new BinaryView(bLoca).next(Loca.Io, ctx.head, ctx.maxp);
        const glyf = new BinaryView(bGlyf).next(Glyf.Read, loca, gOrd, ctx.coStat);
        const bGvar = sfnt.tables.get(Gvar.Tag);
        if (ctx.designSpace && bGvar) {
            const gvarIgnore = {
                horizontalMetric: ctx.hMetricVariable,
                verticalMetric: ctx.vMetricVariable
            };
            const gvar = new BinaryView(bGvar).next(
                Gvar.Read,
                gOrd,
                cfg,
                gvarIgnore,
                ctx.designSpace
            );
        }
        rectifyGlyphOrder(gOrd);
        // Co-glyphs
        const cog: TtfCoGlyphs = {};
        const bFpgm = sfnt.tables.get(Fpgm.Tag);
        if (bFpgm) cog.fpgm = new BinaryView(bFpgm).next(FpgmIo);
        const bPrep = sfnt.tables.get(Prep.Tag);
        if (bPrep) cog.prep = new BinaryView(bPrep).next(PrepIo);
        const bCvt = sfnt.tables.get(Cvt.Tag);
        if (bCvt) {
            cog.cvt = new BinaryView(bCvt).next(CvtIo);
            const bCvar = sfnt.tables.get(Cvt.TagVar);
            if (ctx.designSpace && bCvar) {
                new BinaryView(bCvar).next(CvarIo, cog.cvt, ctx.designSpace);
            }
        }

        return cog;
    }
};
export const WriteTtfGlyphs: WriteGlyphStoreImpl<TtfCfg, TtfCoGlyphs> = {
    writeMetricVariance: true,
    writeGlyphs(sfnt, cfg, coGlyphs, gOrd, ctx) {
        if (ctx.designSpace && coGlyphs.cvt) {
            const afEmpty = new ImpLib.State<boolean>(false);
            const bCvar = Frag.packFrom(CvarIo, coGlyphs.cvt, ctx.designSpace, afEmpty);
            if (!afEmpty.get()) sfnt.add(Cvt.TagVar, bCvar);
        }

        if (coGlyphs.cvt) sfnt.add(Cvt.Tag, Frag.packFrom(CvtIo, coGlyphs.cvt));
        if (coGlyphs.fpgm) sfnt.add(Fpgm.Tag, Frag.packFrom(FpgmIo, coGlyphs.fpgm));
        if (coGlyphs.prep) sfnt.add(Prep.Tag, Frag.packFrom(PrepIo, coGlyphs.prep));

        if (ctx.designSpace) {
            const afEmpty = new ImpLib.State<boolean>(false);
            const bGvar = Frag.packFrom(Gvar.Write, gOrd, cfg, ctx.designSpace, afEmpty);
            if (!afEmpty.get()) sfnt.add(Gvar.Tag, bGvar);
        }
        const loca1: Loca.Table = { glyphOffsets: [] };
        const bufGlyf = Frag.packFrom(Glyf.Write, gOrd, loca1, ctx.stat);
        sfnt.add(Glyf.Tag, bufGlyf);
        const bufLoca = Frag.packFrom(Loca.Io, loca1, ctx.head);
        sfnt.add(Loca.Tag, bufLoca);
    }
};
