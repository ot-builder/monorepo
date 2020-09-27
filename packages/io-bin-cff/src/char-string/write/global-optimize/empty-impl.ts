import { Frag } from "@ot-builder/bin-util";

import { CffLimits, CffWriteContext } from "../../../context/write";
import { CffInterp } from "../../../interp/ir";
import { CharStringOperator } from "../../../interp/operator";
import { CharStringEncoder } from "../encoder";
import { Mir } from "../mir";

import { CharStringGlobalOptimizer, CharStringGlobalOptimizerFactory } from "./general";

class CharStringGlobalOptEmptyImpl implements CharStringGlobalOptimizer {
    private limits: CffLimits;
    private charStrings: Buffer[] = [];
    private localSubroutines: Buffer[][] = [];
    private globalSubroutines: Buffer[] = [];

    constructor(ctx: CffWriteContext, fdCount: number) {
        this.limits = ctx.getLimits();
        for (let fdId = 0; fdId < fdCount; fdId++) {
            this.localSubroutines[fdId] = [];
        }
    }

    public addCharString(gid: number, fdId: number, mirSeq: Iterable<Mir>) {
        const frag = new Frag();
        const encoder = new CharStringEncoder(frag);
        const irSeq = Mir.toInterpIrSeq(mirSeq);

        for (const ir of irSeq) {
            // Filter out existing EndChar operators -- we will add them at the end if necessary
            if (CffInterp.isOperator(ir) && ir.opCode === CharStringOperator.EndChar) continue;
            encoder.push(ir);
        }
        if (this.limits.endCharSize) encoder.push(CffInterp.operator(CharStringOperator.EndChar));

        const buf = Frag.pack(frag);
        this.charStrings[gid] = buf;
    }

    public getResults() {
        return {
            charStrings: this.charStrings,
            localSubroutines: this.localSubroutines,
            globalSubroutines: this.globalSubroutines
        };
    }
}

export const CharStringGlobalOptEmptyImplFactory: CharStringGlobalOptimizerFactory = {
    createOptimizer(ctx, fdCount) {
        return new CharStringGlobalOptEmptyImpl(ctx, fdCount);
    }
};
