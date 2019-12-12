import { Read } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { Cff, CffCoGlyphsWithNaming, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffCfg } from "../cfg";
import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CffReadContext } from "../context/read";
import { CffTopDictIo } from "../dict/top";
import { Cff2Header } from "../structs/cff2-header";

import { cffCleanupUnusedData, readCffCommon } from "./shared";

export const ReadCff2 = Read(
    (
        view,
        cfg: Config<CffCfg>,
        gOrd: Data.Order<OtGlyph>,
        axes?: Data.Maybe<Data.Order<OtVar.Axis>>,
        coStat?: Data.Maybe<OtGlyph.CoStat.Source>
    ): CffCoGlyphsWithNaming => {
        const ctx = new CffReadContext(2, view.lift(0), coStat);
        const cff = new Cff.Table(2);

        const header = view.next(Cff2Header);
        const topDict = view.next(CffTopDictIo, ctx, header.topDictLength);
        const gSubrs = view.next(CffSubroutineIndex, ctx);

        readCffCommon(cff, gOrd, topDict, ctx, gSubrs, axes);

        cffCleanupUnusedData(cff);

        return { cff, cffGlyphNaming: ctx.naming };
    }
);
