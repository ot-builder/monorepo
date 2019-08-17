import { CffWriteContext } from "../../context/write";

import { CffDrawCall, CffDrawCallRaw } from "./draw-call";
import { cffOptimizeDrawCall, DrawCallOptimizationPass } from "./draw-call-optimize/general";
import { Mir } from "./mir";

export function TestRawDcOptimize(
    ctx: CffWriteContext,
    passes: DrawCallOptimizationPass<unknown>[],
    original: CffDrawCallRaw[],
    optimized: string
) {
    const dc = CffDrawCall.charStringSeqFromRawSeq(ctx, original);
    const dcOpt = Array.from(cffOptimizeDrawCall(dc, passes));
    const msActual = CffDrawCall.charStringSeqToMir(ctx, dcOpt);
    mirSeqIsWellFormed(ctx, msActual);
    expect(Mir.rectifyMirStr(Mir.printCharString(msActual))).toBe(Mir.rectifyMirStr(optimized));
}

export function mirSeqIsWellFormed(ctx: CffWriteContext, mirSeq: Mir[]) {
    let sp: number = 0;
    const maxStack = ctx.getLimits().maxStack;
    for (const mir of mirSeq) {
        expect(true).toBe(sp + mir.stackRidge < maxStack);
        expect(true).toBe(sp + mir.stackRise < maxStack);
        sp += mir.stackRise;
    }
    expect(sp).toBe(0);
}
