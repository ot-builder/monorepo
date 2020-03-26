import { Frag, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Cff, OtGlyph } from "@ot-builder/ot-glyphs";
import { Head } from "@ot-builder/ot-metadata";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffCfg } from "../cfg";
import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CharStringGlobalOptimizeResult } from "../char-string/write/global-optimize/general";
import { CffWriteContext } from "../context/write";
import { CffFdArrayIo } from "../dict/font-dict";
import { CffTopDictIo, CffTopDictWrite } from "../dict/top";
import { CffFdSelect } from "../fd-select/io";
import { Cff2Header } from "../structs/cff2-header";
import { Cff2IVS } from "../structs/cff2-ivs";

import { buildCharStrings, cffCleanupUnusedData, getRevFdSelect } from "./shared";

export const WriteCff2 = Write(
    (
        frag: Frag,
        cff: Cff.Table,
        gOrd: Data.Order<OtGlyph>,
        cfg: CffCfg,
        head: Head.Table,
        designSpace?: Data.Maybe<OtVar.DesignSpace>,
        stat?: Data.Maybe<OtGlyph.Stat.Sink>
    ) => {
        cffCleanupUnusedData(cff);

        const ctx = new CffWriteContext(cff.version, head.unitsPerEm, !!designSpace, stat);
        const charStringResults = buildCharStrings(cff, cfg, gOrd, ctx);

        const td: CffTopDictWrite = setupTopDict(cff, gOrd, charStringResults, ctx, designSpace);

        const fgTop = Frag.from(CffTopDictIo, td, ctx, undefined);

        // WRITE!
        frag.push(Cff2Header, {
            majorVersion: 2,
            minorVersion: 0,
            headerSize: 5,
            topDictLength: fgTop.size
        });
        frag.embed(fgTop);
        frag.push(CffSubroutineIndex, charStringResults.globalSubroutines, ctx);
        cffCleanupUnusedData(cff);
    }
);

function setupTopDict(
    cff: Cff.Table,
    gOrd: Data.Order<OtGlyph>,
    charStringResults: CharStringGlobalOptimizeResult,
    ctx: CffWriteContext,
    designSpace?: Data.Maybe<OtVar.DesignSpace>
) {
    const td: CffTopDictWrite = new CffTopDictWrite(cff.topDict);
    td.fgCharStrings = Frag.from(CffSubroutineIndex, charStringResults.charStrings, ctx);
    if (!cff.fdArray) throw Errors.Cff.ShouldHaveFdArray();
    td.fgFDArray = Frag.from(CffFdArrayIo, cff.fdArray, ctx);
    if (cff.fdSelect) td.fgFDSelect = Frag.from(CffFdSelect, getRevFdSelect(cff, gOrd), ctx);
    else td.fgFDSelect = null;
    if (ctx.ivs && designSpace) td.fgVarStore = Frag.from(Cff2IVS, ctx.ivs, designSpace);
    else td.fgVarStore = null;
    return td;
}
