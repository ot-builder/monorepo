import { CffLimits, CffWriteContext } from "../../../context/write";
import { Mir } from "../mir";

import { CharStringGlobalOptimizer, CharStringGlobalOptimizerFactory } from "./general";
import { Pairing } from "./pair/analyzer";
import { SubroutineAnalyzer } from "./subr/general";
import { RuleSet } from "./subr/rule-set";

class CharStringGlobalOptSubr implements CharStringGlobalOptimizer {
    private readonly limits: CffLimits;
    private localSubroutines: Buffer[][] = [];

    private analyzer: SubroutineAnalyzer;

    constructor(ctx: CffWriteContext, fdCount: number) {
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
