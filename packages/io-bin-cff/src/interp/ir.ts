import { Data } from "@ot-builder/prelude";

export namespace CffInterp {
    export type Operator = { opCode: number; flags?: Data.Maybe<number[]> };
    export type Operand = { t: number };
    export type IR = Operator | Operand;

    export function isOperator(ir: IR): ir is Operator {
        return (ir as any).opCode !== undefined;
    }

    export function operand(x: number): Operand {
        return { t: x };
    }
    export function operator(x: number, flags?: Data.Maybe<number[]>): Operator {
        return { opCode: x, flags };
    }

    export abstract class Interpreter {
        protected abstract doOperand(op: number): void;
        protected abstract doOperator(opCode: number, flags?: Data.Maybe<number[]>): void;

        public operand(...xs: number[]) {
            for (const x of xs) this.doOperand(x);
            return this;
        }
        public operator(opCode: number, flags?: number[]) {
            this.doOperator(opCode, flags);
            return this;
        }
        public next(ir: IR) {
            if (isOperator(ir)) {
                this.doOperator(ir.opCode, ir.flags);
            } else {
                this.doOperand(ir.t);
            }
        }
    }

    export abstract class Encoder<Sink> {
        protected abstract operand(op: number): void;
        protected abstract operator(opCode: number, flags?: Data.Maybe<number[]>): void;

        public push(ir: IR) {
            if (isOperator(ir)) {
                this.operator(ir.opCode, ir.flags);
            } else {
                this.operand(ir.t);
            }
        }
    }

    export interface IrSource {
        next(): IR | null;
    }
    export interface IrFlagPuller {
        pullFlags(n: number): number[];
    }
}
