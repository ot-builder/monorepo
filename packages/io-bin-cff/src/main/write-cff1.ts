import { Frag, Write } from "@ot-builder/bin-util";
import { Config } from "@ot-builder/cfg-log";
import { Errors } from "@ot-builder/errors";
import { Cff, OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Head } from "@ot-builder/ft-metadata";
import { Data } from "@ot-builder/prelude";

import { CffCfg } from "../cfg";
import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CharStringGlobalOptimizeResult } from "../char-string/write/global-optimize/general";
import { CffCidCharSetSource, CffGlyphNameCharSetSource } from "../charset/glyph-data-source";
import { CffCharSet } from "../charset/io";
import { CffWriteContext } from "../context/write";
import { CffFdArrayIo } from "../dict/font-dict";
import { CffTopDictIndexWrite, CffTopDictWrite } from "../dict/top";
import { CffFdSelect } from "../fd-select/io";
import { CffStringIndex } from "../strings/string-index";
import { Cff1Header } from "../structs/cff1-header";

import { buildCharStrings, cffCleanupUnusedData, getRevFdSelect } from "./shared";

export const WriteCff1 = Write(
    (
        frag: Frag,
        cff: Cff.Table,
        gOrd: OtGlyphOrder,
        cfg: Config<CffCfg>,
        head: Head.Table,
        stat?: Data.Maybe<OtGlyph.Stat.Sink>
    ) => {
        cffCleanupUnusedData(cff);
        const ctx = new CffWriteContext(cff.version, head.unitsPerEm, false, stat);
        if (!ctx.strings) throw Errors.Cff.ShouldHaveStrings();
        if (cff.cid && !cff.fdArray) throw Errors.Cff.ShouldHaveFdArray();

        const charStringResults = buildCharStrings(cff, cfg, gOrd, ctx);

        // Set up top dict
        const td: CffTopDictWrite = setupTopDict(cff, gOrd, charStringResults, ctx);

        // WRITE!
        frag.push(Cff1Header, {
            majorVersion: 1,
            minorVersion: 0,
            headerSize: 4,
            offSize: 4
        });
        frag.push(CffStringIndex, [cff.postScriptFontName], ctx);
        frag.push(CffTopDictIndexWrite, td, ctx);
        frag.push(CffStringIndex, ctx.strings.getStringIndexList(), ctx);
        frag.push(CffSubroutineIndex, charStringResults.globalSubroutines, ctx);
        cffCleanupUnusedData(cff);
    }
);

function setupTopDict(
    cff: Cff.Table,
    gOrd: OtGlyphOrder,
    charStringResults: CharStringGlobalOptimizeResult,
    ctx: CffWriteContext
) {
    const td: CffTopDictWrite = new CffTopDictWrite(cff.fontDict);
    td.cidROS = cff.cid;
    td.fgCharStrings = Frag.from(CffSubroutineIndex, charStringResults.charStrings, ctx);
    if (cff.fdArray) td.fgFDArray = Frag.from(CffFdArrayIo, cff.fdArray, ctx);
    else td.fgFDArray = null;
    if (cff.fdSelect) td.fgFDSelect = Frag.from(CffFdSelect, getRevFdSelect(cff, gOrd), ctx);
    else td.fgFDSelect = null;
    td.fgVarStore = null;
    if (cff.cid) {
        td.fgCharSet = Frag.from(
            CffCharSet,
            new CffCidCharSetSource(ctx, gOrd, cff.cid.mapping),
            ctx
        );
    } else {
        td.fgCharSet = Frag.from(CffCharSet, new CffGlyphNameCharSetSource(ctx, gOrd), ctx);
    }
    return td;
}
