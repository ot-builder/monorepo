import type { CffLimits } from "../../../../context/write";
import type { Mir } from "../../mir";

import type { RuleSet } from "./rule-set";

export interface SubroutineAnalyzer {
    addInput(limits: CffLimits, mirSeq: Iterable<Mir>): void;
    analyze(rules: RuleSet): void;
}

export interface SubroutineAnalyzerFactory {
    create(): SubroutineAnalyzer;
}
