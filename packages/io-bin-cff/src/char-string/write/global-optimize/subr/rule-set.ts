import { Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";

import { CffLimits } from "../../../../context/write";
import { CffInterp } from "../../../../interp/ir";
import { CharStringOperator } from "../../../../interp/operator";
import { computeSubroutineBias } from "../../../read/interpreter";
import { CharStringEncoder } from "../../encoder";
import { Mir, MirNonTerminal, MirType } from "../../mir";

const callSizeCache: number[] = [];
function estimateCallSize(scEst: number) {
    if (callSizeCache[scEst]) return callSizeCache[scEst];
    const bias = computeSubroutineBias(scEst);
    const size =
        CharStringEncoder.measureOperator(CharStringOperator.CallGSubr) +
        Math.max(
            CharStringEncoder.measureInt(-bias),
            CharStringEncoder.measureInt(0),
            CharStringEncoder.measureInt(scEst - bias)
        );
    callSizeCache[scEst] = size;
    return size;
}

export class Rule {
    constructor(public parts: Mir[]) {}

    // Stat flags and properties
    public stated = false;
    public subrId = -1;
    public depth = 0;
    public staticSize = 0;
    public selfSize: number = 0;
    public expandedSize: number = 0;
    public refCount = 0;

    public inputRefCount = 0;
    public nonTerminalRefCount: Map<number, number> = new Map();

    public resetStat() {
        this.stated = false;
        this.refCount = 0;
    }

    // How many bytes can we save?
    // scEst: estimated subroutine index length
    // rc: Ref-count of this rule
    public utility(limits: CffLimits, scEst: number, rc: number) {
        const callSize = estimateCallSize(scEst);
        const indexSize = scEst < 0x10 ? 1 : scEst < 0x1000 ? 2 : scEst < 0x100000 ? 3 : 4;
        return this.selfSize * rc - (indexSize + limits.retSize + this.selfSize + callSize * rc);
    }
}
export class NTRuleStub {
    constructor(public symbol: MirNonTerminal, public parts: Mir[]) {}
}

export class RuleSet {
    public inputRules: Rule[] = [];
    public nonTerminalRules: Rule[] = [];

    private statRule(rule: Rule, scEst: number) {
        let selfSize = rule.staticSize;
        let expandedSize = rule.staticSize;
        for (const ir of rule.parts) {
            switch (ir.type) {
                case MirType.NonTerminal: {
                    const innerRule = this.nonTerminalRules[ir.id];
                    if (!innerRule.stated) throw Errors.Unreachable();
                    if (innerRule.subrId >= 0) {
                        selfSize += estimateCallSize(scEst);
                    } else {
                        selfSize += innerRule.selfSize;
                    }
                    expandedSize += innerRule.expandedSize;
                    break;
                }
            }
        }
        rule.selfSize = selfSize;
        rule.expandedSize = expandedSize;
        rule.stated = true;
    }

    private staticStatRule(rid: number, rule: Rule, isInput: boolean) {
        let staticSize = 0;
        for (const ir of rule.parts) {
            switch (ir.type) {
                case MirType.Operand: {
                    const size = CharStringEncoder.measureOperand(ir.arg);
                    staticSize += size;
                    break;
                }
                case MirType.Operator: {
                    const size = CharStringEncoder.measureOperator(ir.opCode, ir.flags);
                    staticSize += size;
                    break;
                }
                case MirType.NonTerminal: {
                    const innerRule = this.nonTerminalRules[ir.id];
                    if (isInput) {
                        innerRule.inputRefCount += 1;
                    } else {
                        innerRule.nonTerminalRefCount.set(
                            rid,
                            1 + (innerRule.nonTerminalRefCount.get(rid) || 0)
                        );
                    }
                }
            }
        }
        rule.staticSize = staticSize;
    }

    private staticStatRules() {
        for (let rid = 0; rid < this.nonTerminalRules.length; rid++) {
            this.staticStatRule(rid, this.nonTerminalRules[rid], false);
        }
        for (let rid = 0; rid < this.inputRules.length; rid++) {
            this.staticStatRule(rid, this.inputRules[rid], true);
        }
    }

    private dpOptimize(limits: CffLimits, scEst: number) {
        let sid = 0;
        for (const rule of this.nonTerminalRules) {
            rule.subrId = -1;
            rule.refCount = 0;
            rule.depth = 0;
        }
        for (let rid = this.nonTerminalRules.length; rid-- > 0; ) {
            const rule = this.nonTerminalRules[rid];
            let refCount = rule.inputRefCount,
                depth = 1;
            for (const [outerRid, crossReferences] of rule.nonTerminalRefCount) {
                if (crossReferences <= 0) continue;
                const outerRule = this.nonTerminalRules[outerRid];
                if (outerRule.subrId >= 0) {
                    // Outer rule is a subroutine
                    refCount += crossReferences;
                    if (outerRule.depth + 1 > depth) depth = outerRule.depth + 1;
                } else {
                    // Outer rule is inlined
                    refCount += outerRule.refCount * crossReferences;
                    if (outerRule.depth > depth) depth = outerRule.depth;
                }
            }
            rule.refCount = refCount;
            rule.depth = depth;
            const utility = rule.utility(limits, scEst, refCount);
            if (
                sid < scEst * 2 &&
                sid < limits.maxSubrs &&
                depth < limits.maxRecursion &&
                utility >= 0
            ) {
                rule.subrId = sid++;
            } else {
                rule.subrId = -1;
            }
        }
        return sid;
    }

    public statRules(scEst: number) {
        for (const rule of this.inputRules) rule.resetStat();
        for (const rule of this.nonTerminalRules) rule.resetStat();
        for (const rule of this.nonTerminalRules) this.statRule(rule, scEst);
        for (const rule of this.inputRules) this.statRule(rule, scEst);
    }

    private currentSidPlan() {
        const plan: number[] = [];
        for (let ix = 0; ix < this.nonTerminalRules.length; ix++) {
            plan[ix] = this.nonTerminalRules[ix].subrId;
        }
        return plan;
    }

    public optimize(limits: CffLimits) {
        // Initialize with "no subroutines"
        for (const rule of this.nonTerminalRules) rule.subrId = -1;

        // Best SubrID plan so far
        let bestSize = 0x7fffffff;
        let bestSidPlan: number[] = this.currentSidPlan();

        // Estimated subroutine index size and do initial stat
        let srCount = limits.maxSubrs;
        this.staticStatRules();
        this.statRules(srCount);

        // Run optimization
        for (let round = 0; round < 8; round++) {
            // Do a DP optimize then update the rules' size
            srCount = this.dpOptimize(limits, srCount);
            this.statRules(srCount);

            // Get current blobs' size
            let currentSize = 0;
            for (const rule of this.inputRules) {
                currentSize += rule.selfSize;
            }
            for (const rule of this.nonTerminalRules) {
                if (rule.subrId >= 0) currentSize += rule.selfSize;
            }

            // console.log(
            //     `|NT| ${this.nonTerminalRules.length} |SR| ${srCount} ` +
            //         `size ${currentSize} min ${bestSize}`
            // );

            // Do we have a better result?
            const currentPlan = this.currentSidPlan();
            if (currentSize < bestSize) {
                bestSize = currentSize;
                bestSidPlan = currentPlan;
            } else {
                // Stop when stabilized
                let stable = true;
                for (let rid = 0; rid < bestSidPlan.length; rid++) {
                    if (currentPlan[rid] !== bestSidPlan[rid]) stable = false;
                }
                if (stable) break;
            }
        }

        // Apply the best plan we have
        for (let ix = 0; ix < this.nonTerminalRules.length; ix++) {
            this.nonTerminalRules[ix].subrId = bestSidPlan[ix];
        }
    }

    // Rule to MirSeq
    private *compileRule(
        rule: Rule,
        scEst: number,
        end: CharStringOperator | null
    ): IterableIterator<CffInterp.IR> {
        const bias = computeSubroutineBias(scEst);
        for (const ir of rule.parts) {
            switch (ir.type) {
                case MirType.Operand: {
                    yield CffInterp.operand(ir.arg);
                    break;
                }
                case MirType.Operator: {
                    yield CffInterp.operator(ir.opCode, ir.flags);
                    break;
                }
                case MirType.NonTerminal: {
                    const innerRule = this.nonTerminalRules[ir.id];
                    if (!innerRule) throw Errors.Unreachable();
                    if (innerRule.subrId >= 0) {
                        yield CffInterp.operand(innerRule.subrId - bias);
                        yield CffInterp.operator(CharStringOperator.CallGSubr);
                    } else {
                        yield* this.compileRule(innerRule, scEst, null);
                    }
                    break;
                }
            }
        }
        if (end) yield CffInterp.operator(end);
    }
    private encodeRule(rule: Rule, scEst: number, end: CharStringOperator | null) {
        const frag = new Frag();
        const encoder = new CharStringEncoder(frag);
        const irSeq = this.compileRule(rule, scEst, end);
        for (const ir of irSeq) encoder.push(ir);
        return Frag.pack(frag);
    }

    public compile(limits: CffLimits) {
        const subroutines: Buffer[] = [];
        const charStrings: Buffer[] = [];
        let scEst = 0;
        for (const rule of this.nonTerminalRules) {
            if (rule.subrId + 1 > scEst) scEst = rule.subrId + 1;
        }

        for (const rule of this.inputRules) {
            charStrings.push(
                this.encodeRule(rule, scEst, limits.endCharSize ? CharStringOperator.EndChar : null)
            );
        }
        for (const rule of this.nonTerminalRules) {
            if (rule.subrId < 0) continue;
            subroutines[rule.subrId] = this.encodeRule(
                rule,
                scEst,
                limits.retSize ? CharStringOperator.Return : null
            );
        }

        return { subroutines, charStrings };
    }

    // Printing
    private printRule(rule: Rule, header: string) {
        let s = header;
        for (const ir of rule.parts) {
            switch (ir.type) {
                case MirType.Operand: {
                    s += `${ir.arg} `;
                    break;
                }
                case MirType.Operator: {
                    s += `${CharStringOperator[ir.opCode]}`;
                    if (ir.flags) s += `[${ir.flags.join("")}]`;
                    s += " ";
                    break;
                }
                case MirType.NonTerminal: {
                    const innerRule = this.nonTerminalRules[ir.id];
                    if (!innerRule) throw Errors.Unreachable();
                    if (innerRule.subrId >= 0) s += `{${innerRule.subrId}} `;
                    else s += `( ${this.printRule(innerRule, "")}) `;
                    break;
                }
            }
        }
        return s;
    }
    private ruleHeaderStart(rule: Rule, header: string) {
        return (
            `${header} :: DE ${rule.depth} ` +
            `RC ${rule.refCount} SS ${rule.selfSize} XS ${rule.expandedSize} :: `
        );
    }
    public printPlan() {
        let s = "";
        for (const [gid, rule] of this.inputRules.entries()) {
            s += this.printRule(rule, this.ruleHeaderStart(rule, `CharString${gid}`)) + "\n";
        }
        for (const [gid, rule] of this.nonTerminalRules.entries()) {
            if (rule.subrId < 0) continue;
            s += this.printRule(rule, this.ruleHeaderStart(rule, `Subr${rule.subrId}`)) + "\n";
        }
        return s;
    }
}
