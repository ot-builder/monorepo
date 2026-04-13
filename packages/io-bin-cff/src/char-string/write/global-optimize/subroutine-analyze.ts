import type { CffLimits, CffWriteContext } from "../../../context/write";
import type { Mir } from "../mir";

import type { CharStringGlobalOptimizer, CharStringGlobalOptimizerFactory } from "./general";
import { Pairing } from "./pair/analyzer";
import type { SubroutineAnalyzer } from "./subr/general";
import { RuleSet } from "./subr/rule-set";

class CharStringGlobalOptSubr implements CharStringGlobalOptimizer {
    private readonly limits: CffLimits;
    private localSubroutines: Buffer[][] = [];

    private analyzer: SubroutineAnalyzer;

    public constructor(ctx: CffWriteContext, fdCount: number) {
        for (let fdId = 0; fdId < fdCount; fdId++) {
            this.localSubroutines[fdId] = [];
        }
        this.limits = ctx.getLimits();
        this.analyzer = Pairing.create();
    }

    public addCharString(gid: number, fdId: number, mirSeq: Iterable<Mir>) {
        this.analyzer.addInput(this.limits, mirSeq);
    }

    public getResults() {
        const ruleSet = new RuleSet();
        this.analyzer.analyze(ruleSet);
        ruleSet.optimize(this.limits);
        const { charStrings, subroutines: globalSubroutines } = ruleSet.compile(this.limits);

        return {
            charStrings: charStrings,
            localSubroutines: this.localSubroutines,
            globalSubroutines: globalSubroutines
        };
    }
}

export const CharStringGlobalOptSubrFactory: CharStringGlobalOptimizerFactory = {
    createOptimizer(ctx, fdCount) {
        return new CharStringGlobalOptSubr(ctx, fdCount);
    }
};
