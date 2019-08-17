import { CffWriteContext } from "../../../context/write";
import { Mir } from "../mir";

export interface CharStringGlobalOptimizeResult {
    globalSubroutines: Buffer[];
    localSubroutines: Buffer[][];
    charStrings: Buffer[];
}

export interface CharStringGlobalOptimizer {
    addCharString(gid: number, fdId: number, mirSeq: Iterable<Mir>): void;
    getResults(): CharStringGlobalOptimizeResult;
}

export interface CharStringGlobalOptimizerFactory {
    createOptimizer(ctx: CffWriteContext, fdCount: number): CharStringGlobalOptimizer;
}
