import { Frag } from "@ot-builder/bin-util";

import { CffWriteContext } from "../../../context/write";
import { CharStringEncoder } from "../encoder";
import { Mir } from "../mir";

import { CharStringGlobalOptimizer, CharStringGlobalOptimizerFactory } from "./general";

class CharStringGlobalOptEmptyImpl implements CharStringGlobalOptimizer {
    private charStrings: Buffer[] = [];
    private localSubroutines: Buffer[][] = [];
    private globalSubroutines: Buffer[] = [];

    constructor(ctx: CffWriteContext, fdCount: number) {
        for (let fdId = 0; fdId < fdCount; fdId++) {
            this.localSubroutines[fdId] = [];
        }
    }

    public addCharString(gid: number, fdId: number, mirSeq: Iterable<Mir>) {
        const frag = new Frag();
        const encoder = new CharStringEncoder(frag);
        const irSeq = Mir.toInterpIrSeq(mirSeq);
        for (const ir of irSeq) encoder.push(ir);
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
