import { Config } from "@ot-builder/cfg-log";
import { Errors } from "@ot-builder/errors";
import { Cff, OtGlyph, OtGlyphOrder } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffCfg } from "../cfg";
import { CffCharStringInterpStateImpl } from "../char-string/read/interpret-state";
import { interpretCharString } from "../char-string/read/interpreter";
import { CffGlyphBuilder } from "../char-string/read/shape-building";
import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CffDrawCall } from "../char-string/write/draw-call";
import { codeGenGlyph } from "../char-string/write/draw-call-gen";
import {
    MinimalDrawCallOptimizers,
    StandardDrawCallOptimizers
} from "../char-string/write/draw-call-optimize";
import { cffOptimizeDrawCall } from "../char-string/write/draw-call-optimize/general";
import { CharStringGlobalOptEmptyImplFactory } from "../char-string/write/global-optimize/empty-impl";
import { CharStringGlobalOptimizeResult } from "../char-string/write/global-optimize/general";
import { CharStringGlobalOptSubrFactory } from "../char-string/write/global-optimize/subroutine-analyze";
import { CffCidCharsetSink, CffGlyphNameCharsetSink } from "../charset/glyph-data-sink";
import { CffCharSet, CffCharSetSink } from "../charset/io";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";
import { CffFdArrayIo } from "../dict/font-dict";
import { CffTopDictRead } from "../dict/top";
import { CffGlyphFdSelectSink } from "../fd-select/glyph-data-sink";
import { CffFdSelect } from "../fd-select/io";
import { Cff2IVS } from "../structs/cff2-ivs";

function getCorrespondedPd(cff: Cff.Table, fdId: number) {
    const fd = cff.fdArray ? cff.fdArray[fdId] || cff.fontDict : cff.fontDict;
    return fd.privateDict;
}

export function readCffCommon(
    cff: Cff.Table,
    gOrd: OtGlyphOrder,
    topDict: CffTopDictRead,
    ctx: CffReadContext,
    gSubrs: Buffer[],
    axes?: Data.Maybe<Data.Order<OtVar.Axis>>
) {
    cff.fontDict = topDict.fd;
    if (topDict.cidROS) cff.cid = topDict.cidROS;
    if (axes && topDict.vVarStore) ctx.ivs = topDict.vVarStore.next(Cff2IVS, axes);
    if (topDict.vFDArray) cff.fdArray = topDict.vFDArray.next(CffFdArrayIo, ctx);
    if (topDict.vFDSelect) {
        cff.fdSelect = new Map<OtGlyph, number>();
        topDict.vFDSelect.next(CffFdSelect, ctx, new CffGlyphFdSelectSink(gOrd, cff.fdSelect));
    }
    if (topDict.vCharSet) {
        let charSetSink: CffCharSetSink;
        if (cff.cid) {
            cff.cid.mapping = new Map();
            charSetSink = new CffCidCharsetSink(gOrd, ctx.naming, cff.cid.mapping);
        } else {
            charSetSink = new CffGlyphNameCharsetSink(gOrd, ctx.naming, ctx);
        }
        topDict.vCharSet.next(CffCharSet, ctx, charSetSink);
    }
    if (topDict.vCharStrings) {
        const charStrings = topDict.vCharStrings.next(CffSubroutineIndex, ctx);
        for (let gid = 0; gid < gOrd.length; gid++) {
            const glyph = gOrd.at(gid);
            readGlyph(ctx, cff, gid, glyph, charStrings, gSubrs);
        }
    }
}

function readGlyph(
    ctx: CffReadContext,
    cff: Cff.Table,
    gid: number,
    glyph: OtGlyph,
    charStrings: Buffer[],
    gSubrs: Buffer[]
) {
    const fdId = cff.fdSelect ? cff.fdSelect.get(glyph) || 0 : 0;
    const pd = getCorrespondedPd(cff, fdId);
    if (!pd) throw Errors.Cff.MissingPrivateDict(fdId);
    const localSubrs: Buffer[] = pd.localSubroutines || [];

    // Interpret charString
    const gb = new CffGlyphBuilder(glyph);
    const st = new CffCharStringInterpStateImpl(ctx.ivs);
    // Private dicts have inherited VS index, we should take this into consideration
    // cf. https://docs.microsoft.com/en-us/typography/opentype/spec/cff2charstr#syntax-for-font-variations-support-operators
    if (ctx.ivs) st.setVsIndex(pd.inheritedVsIndex);
    gb.setWidth(pd.defaultWidthX);
    interpretCharString(
        charStrings[gid],
        st,
        {
            global: gSubrs,
            local: localSubrs,
            defaultWidthX: pd.defaultWidthX,
            nominalWidthX: pd.nominalWidthX
        },
        gb
    );
    gb.endChar();

    // Apply coStat data
    const hMet = ctx.coStat.getHMetric(gid, null);
    if (hMet) glyph.horizontal = hMet;
    const vMet = ctx.coStat.getVMetric(gid, null);
    if (vMet) glyph.vertical = vMet;
}

export function cffCleanupUnusedData(cff: Cff.Table) {
    if (cff.fontDict && cff.fontDict.privateDict) {
        cff.fontDict.privateDict.localSubroutines = null;
    }
    if (cff.fdArray) {
        for (const fd of cff.fdArray) if (fd.privateDict) fd.privateDict.localSubroutines = null;
    }
}

function setLocalSubrForFd(fd: Cff.FontDict, lSubrs: Buffer[]) {
    if (!lSubrs.length) return;
    if (!fd.privateDict) fd.privateDict = new Cff.PrivateDict();
    fd.privateDict.localSubroutines = lSubrs;
}

export function applyBuildResults(cff: Cff.Table, results: CharStringGlobalOptimizeResult) {
    if (cff.fdArray && cff.fdArray.length) {
        for (let fdId = 0; fdId < cff.fdArray.length; fdId++) {
            const fd = cff.fdArray[fdId];
            const lSubrs = results.localSubroutines[fdId] || [];
            setLocalSubrForFd(fd, lSubrs);
        }
    } else {
        setLocalSubrForFd(cff.fontDict, results.localSubroutines[0] || []);
    }
}

function getOptimizer(cfg: Config<CffCfg>, ctx: CffWriteContext, fdCount: number) {
    if (cfg.cff.doGlobalOptimization) {
        return CharStringGlobalOptSubrFactory.createOptimizer(ctx, fdCount);
    } else {
        return CharStringGlobalOptEmptyImplFactory.createOptimizer(ctx, fdCount);
    }
}

function getLocalOptimizers(cfg: Config<CffCfg>, ctx: CffWriteContext) {
    if (cfg.cff.doLocalOptimization) {
        return StandardDrawCallOptimizers(ctx);
    } else {
        return MinimalDrawCallOptimizers(ctx);
    }
}

export function buildCharStrings(
    cff: Cff.Table,
    cfg: Config<CffCfg>,
    gOrd: OtGlyphOrder,
    ctx: CffWriteContext
) {
    const fdCount = cff.fdArray ? cff.fdArray.length : 1;
    const optimizer = getOptimizer(cfg, ctx, fdCount);
    ctx.stat.setNumGlyphs(gOrd.length);
    for (let gid = 0; gid < gOrd.length; gid++) {
        const glyph = gOrd.at(gid);
        const fdId = cff.fdSelect ? cff.fdSelect.get(glyph) || 0 : 0;
        if (fdId >= fdCount) throw Errors.Cff.FdIdOverflow(fdId, fdCount);
        const pd = getCorrespondedPd(cff, fdId);
        if (!pd) throw Errors.Cff.MissingPrivateDict(fdId);
        const rawDrawCalls = codeGenGlyph(ctx, gid, glyph, pd);
        const drawCalls = [...cffOptimizeDrawCall(rawDrawCalls, getLocalOptimizers(cfg, ctx))];
        optimizer.addCharString(gid, fdId, CffDrawCall.charStringSeqToMir(ctx, drawCalls));
    }

    const results = optimizer.getResults();
    ctx.stat.settle();
    applyBuildResults(cff, results);
    return results;
}

export function getRevFdSelect(cff: Cff.Table, gOrd: OtGlyphOrder) {
    if (!cff.fdSelect) return [];
    let results: number[] = [];
    for (let gid = 0; gid < gOrd.length; gid++) {
        const fdId = cff.fdSelect.get(gOrd.at(gid)) || 0;
        results[gid] = fdId;
    }
    return results;
}
