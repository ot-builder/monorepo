import { Read } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Cff, CffCoGlyphsWithNaming, OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

import { CffDeferIndex } from "../cff-index/view-list";
import { CffCfg } from "../cfg";
import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CffReadContext } from "../context/read";
import { CffTopDictIo } from "../dict/top";
import { CffStringIndex } from "../strings/string-index";
import { Cff1Header } from "../structs/cff1-header";

import { cffCleanupUnusedData, readCffCommon } from "./shared";

export const ReadCff1 = Read(
    (
        view,
        cfg: CffCfg,
        gOrd: Data.Order<OtGlyph>,
        coStat?: Data.Maybe<OtGlyph.CoStat.Source>
    ): CffCoGlyphsWithNaming => {
        const ctx = new CffReadContext(1, view.lift(0), coStat);
        if (!ctx.strings) throw Errors.Cff.ShouldHaveStrings();

        const cff = new Cff.Table(1);

        const header = view.next(Cff1Header);
        const nameIndex = view.next(CffStringIndex, ctx);
        const topDictIndex = view.next(CffDeferIndex, ctx);
        const stringList = view.next(CffStringIndex, ctx);
        const gSubrs = view.next(CffSubroutineIndex, ctx);

        Assert.Cff.OnlyOneTopDictAllowed(nameIndex);
        Assert.Cff.OnlyOneTopDictAllowed(topDictIndex);
        for (let sidT = 0; sidT < stringList.length; sidT++) {
            ctx.strings.putByStringIndexIndex(sidT, stringList[sidT]);
        }

        cff.postScriptFontName = nameIndex[0];
        const topDict = topDictIndex[0].view.next(CffTopDictIo, ctx, topDictIndex[0].size);
        readCffCommon(cff, gOrd, topDict, ctx, gSubrs);

        cffCleanupUnusedData(cff);

        return { cff, cffGlyphNaming: ctx.naming };
    }
);
