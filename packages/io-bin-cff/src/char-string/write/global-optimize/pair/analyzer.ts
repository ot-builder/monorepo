import { Errors } from "@ot-builder/errors";

import { CffLimits } from "../../../../context/write";
import { CharStringOperator } from "../../../../interp/operator";
import { Mir, MirNonTerminal, MirType } from "../../mir";
import { SubroutineAnalyzer, SubroutineAnalyzerFactory } from "../subr/general";
import { NTRuleStub, Rule, RuleSet } from "../subr/rule-set";

import { MirKeyProvider } from "./ir-key-provider";
import { Input, NonTerminalBuilder, RuleBuilder, Session } from "./pairing";

function buildInput(limits: CffLimits, session: Session<Mir>, source: Iterable<Mir>) {
    const input = new Input<Mir>(Mir.nop());
    let h = 0;
    for (const ir of source) {
        if (h >= limits.maxStack) {
            // We are too tall, add a barrier
            session.append(input, Mir.nop());
        }
        // Skip END-CHAR -- we will add it back later
        if (!(ir.type === MirType.Operator && ir.opCode === CharStringOperator.EndChar)) {
            session.append(input, ir);
        }
        h += ir.stackRise;
    }
    return input;
}

export class PairingAnalyzer
    implements NonTerminalBuilder<Mir>, RuleBuilder<Mir, NTRuleStub, Rule>, SubroutineAnalyzer {
    private pairSession = new Session(MirKeyProvider);

    private inputs: Input<Mir>[] = [];

    public addInput(limits: CffLimits, seq: Iterable<Mir>) {
        this.inputs.push(buildInput(limits, this.pairSession, seq));
    }

    // NonTerminalBuilder<Mir>
    private nNonTerminal = 0;
    public createNonTerminal(a: Mir, b: Mir): MirNonTerminal {
        return {
            type: MirType.NonTerminal,
            id: this.nNonTerminal++,
            stackRise: a.stackRise + b.stackRise,
            stackRidge: Math.max(1, a.stackRidge, a.stackRise + b.stackRidge)
        };
    }

    // RuleBuilder<Mir, Rule, Rule>
    public createNonTerminalRule(symbol: Mir, parts: Mir[]) {
        if (symbol.type !== MirType.NonTerminal) throw Errors.Unreachable();
        return new NTRuleStub(symbol, parts);
    }
    public createInputRule(parts: Mir[]) {
        return new Rule(parts);
    }

    public analyze(into: RuleSet) {
        for (const rule of this.pairSession.doCompress(this, this)) {
            into.nonTerminalRules[rule.symbol.id] = new Rule(rule.parts);
        }
        for (const input of this.inputs) {
            into.inputRules.push(this.pairSession.inputToRule(input, this));
        }
    }
}

export const Pairing: SubroutineAnalyzerFactory = {
    create: () => new PairingAnalyzer()
};
