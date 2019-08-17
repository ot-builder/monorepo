import { Errors } from "@ot-builder/errors";
import { Data } from "@ot-builder/prelude";

import { CffInterp } from "../../interp/ir";
import { CharStringOperator } from "../../interp/operator";

export enum MirType {
    Nop = 0,
    Operand = 1,
    Operator = 2,
    NonTerminal = 3
}

export interface MirShared {
    readonly stackRise: number;
    readonly stackRidge: number;
}

export type MirNop = { type: MirType.Nop } & MirShared;
export type MirOperand = { type: MirType.Operand; arg: number } & MirShared;
export type MirOperator = {
    type: MirType.Operator;
    opCode: number;
    flags?: Data.Maybe<number[]>;
} & MirShared;
export type MirNonTerminal = { type: MirType.NonTerminal; id: number } & MirShared;

export type Mir = MirNop | MirOperand | MirOperator | MirNonTerminal;
export namespace Mir {
    export function nop(): MirNop {
        return { type: MirType.Nop, stackRidge: 0, stackRise: 0 };
    }
    export function operand(x: number): MirOperand {
        return { type: MirType.Operand, arg: x, stackRidge: 1, stackRise: 1 };
    }
    export function operator(
        opCode: number,
        sr: number,
        flags?: Data.Maybe<number[]>
    ): MirOperator {
        return { type: MirType.Operator, opCode, flags, stackRidge: 0, stackRise: sr };
    }
    export function isNonTerminal(ir: Mir): ir is MirNonTerminal {
        return ir.type !== MirType.NonTerminal;
    }

    export function rectifyMirStr(s: string) {
        return s
            .trim()
            .replace(/[ \t]*\n[ \t]*/g, "\n")
            .replace(/\n+/g, "\n")
            .replace(/[ \t]+/g, " ");
    }
    export function printCharString(mirSeq: Iterable<Mir>) {
        let s: string = "";
        for (const mir of mirSeq) {
            switch (mir.type) {
                case MirType.Operand:
                    s += mir.arg + " ";
                    break;
                case MirType.Operator:
                    s += CharStringOperator[mir.opCode];
                    if (mir.flags) s += `[${mir.flags.join(" ")}]`;
                    s += "\n";
                    break;
                case MirType.NonTerminal:
                    s += `{${mir.id}}\n`;
            }
        }
        return s;
    }

    export function* toInterpIrSeq(mirSeq: Iterable<Mir>) {
        for (const mir of mirSeq) {
            switch (mir.type) {
                case MirType.Operand:
                    yield CffInterp.operand(mir.arg);
                    break;
                case MirType.Operator:
                    yield CffInterp.operator(mir.opCode, mir.flags);
                    break;
                default:
                    throw Errors.Unreachable();
            }
        }
    }
}
