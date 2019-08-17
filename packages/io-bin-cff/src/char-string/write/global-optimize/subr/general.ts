import { CffLimits } from "../../../../context/write";
import { Mir } from "../../mir";

import { RuleSet } from "./rule-set";

export interface SubroutineAnalyzer {
    addInput(limits: CffLimits, mirSeq: Iterable<Mir>): void;
    analyze(rules: RuleSet): void;
}

export interface SubroutineAnalyzerFactory {
    create(): SubroutineAnalyzer;
}
