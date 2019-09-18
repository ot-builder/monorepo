import { BinaryView, Frag } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Errors } from "@ot-builder/errors";
import { Cvt, FpgmPrep, TtfCoGlyphs } from "@ot-builder/ft-glyphs";
import {
    CvarIo,
    CvtIo,
    FpgmPrepIo,
    Glyf,
    Gvar,
    Loca,
    rectifyGlyphOrder,
    TtfCfg
} from "@ot-builder/io-bin-ttf";
import { Data } from "@ot-builder/prelude";

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
        if (ctx.axes && bGvar) {
            const gvarIgnore = {
                horizontalMetric: ctx.hMetricVariable,
                verticalMetric: ctx.vMetricVariable
            };
            const gvar = new BinaryView(bGvar).next(Gvar.Read, gOrd, cfg, gvarIgnore, ctx.axes);
        }
        rectifyGlyphOrder(gOrd);
        // Co-glyphs
        let cog: TtfCoGlyphs = {};
        const bFpgm = sfnt.tables.get(FpgmPrep.TagFpgm);
        if (bFpgm) cog.fpgm = new BinaryView(bFpgm).next(FpgmPrepIo);
        const bPrep = sfnt.tables.get(FpgmPrep.TagPrep);
        if (bPrep) cog.prep = new BinaryView(bPrep).next(FpgmPrepIo);
        const bCvt = sfnt.tables.get(Cvt.Tag);
        if (bCvt) {
            cog.cvt = new BinaryView(bCvt).next(CvtIo);
            const bCvar = sfnt.tables.get(Cvt.TagVar);
            if (ctx.axes && bCvar) new BinaryView(bCvar).next(CvarIo, cog.cvt, ctx.axes);
        }

        return cog;
    }
};
export const WriteTtfGlyphs: WriteGlyphStoreImpl<TtfCfg, TtfCoGlyphs> = {
    writeMetricVariance: true,
    writeGlyphs(sfnt, cfg, coGlyphs, gOrd, ctx) {
        if (ctx.axes && coGlyphs.cvt) {
            const afEmpty = new ImpLib.State<boolean>(false);
            const bCvar = Frag.packFrom(CvarIo, coGlyphs.cvt, ctx.axes, afEmpty);
            sfnt.add(Cvt.TagVar, bCvar, afEmpty);
        }
        if (coGlyphs.cvt) {
            sfnt.add(Cvt.Tag, Frag.packFrom(CvtIo, coGlyphs.cvt));
        }
        if (coGlyphs.fpgm) {
            sfnt.add(FpgmPrep.TagFpgm, Frag.packFrom(FpgmPrepIo, coGlyphs.fpgm));
        }
        if (coGlyphs.prep) {
            sfnt.add(FpgmPrep.TagPrep, Frag.packFrom(FpgmPrepIo, coGlyphs.prep));
        }
        if (ctx.axes) {
            const afEmpty = new ImpLib.State<boolean>(false);
            const bGvar = Frag.packFrom(Gvar.Write, gOrd, cfg, ctx.axes, afEmpty);
            sfnt.add(Gvar.Tag, bGvar, afEmpty);
        }
        const loca1: Loca.Table = { glyphOffsets: [] };
        const bufGlyf = Frag.packFrom(Glyf.Write, gOrd, loca1, ctx.stat);
        sfnt.add(Glyf.Tag, bufGlyf);
        const bufLoca = Frag.packFrom(Loca.Io, loca1, ctx.head);
        sfnt.add(Loca.Tag, bufLoca);
    }
};
