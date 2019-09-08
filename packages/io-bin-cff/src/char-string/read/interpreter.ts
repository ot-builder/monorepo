import { BinaryView } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffInterp } from "../../interp/ir";
import { CharStringIrSource } from "../../interp/ir-source";
import { CharStringOperator } from "../../interp/operator";
import { CffStackMachine } from "../../interp/stack-machine";

export interface CffCharStringInterpState {
    getRandom(): number;
    transient: OtVar.Value[];
    log: string;
}

export interface CffSubroutineSource {
    readonly global: Buffer[];
    readonly local: Buffer[];
    readonly defaultWidthX: OtVar.Value;
    readonly nominalWidthX: OtVar.Value;
}

export interface CffCharStringDataSink {
    stemQuantity: number;
    setWidth(x: OtVar.Value): void;
    addStemHint(isVertical: boolean, startEdge: OtVar.Value, endEdge: OtVar.Value): void;
    addHintMask(isCounterMask: boolean, flags: number[]): void;
    startContour(): void;
    lineTo(x: OtVar.Value, y: OtVar.Value): void;
    curveTo(
        x1: OtVar.Value,
        y1: OtVar.Value,
        x2: OtVar.Value,
        y2: OtVar.Value,
        x3: OtVar.Value,
        y3: OtVar.Value
    ): void;
    endChar(): void;
}

export class CffCharStringInterpreter extends CffInterp.Interpreter {
    constructor(
        private readonly fnPullFlags: () => number[],
        private readonly state: CffStackMachine & CffCharStringInterpState,
        private readonly subroutines: CffSubroutineSource,
        private readonly sink: CffCharStringDataSink
    ) {
        super();
    }

    public doOperand(x: number) {
        this.state.log += x + " ";
        this.state.push(x);
    }

    public halt = false;
    public end = false;

    protected doOperator(opCode: number, flags?: Data.Maybe<number[]>) {
        this.state.log += CharStringOperator[opCode] + " ";
        switch (opCode) {
            // Variation
            case CharStringOperator.VsIndex:
                return this.state.doVsIndex();
            case CharStringOperator.Blend:
                return this.state.doBlend();

            // Hints
            case CharStringOperator.HStem:
            case CharStringOperator.VStem:
            case CharStringOperator.HStemHM:
            case CharStringOperator.VStemHM:
                return this.doStemHint(
                    opCode === CharStringOperator.VStem || opCode === CharStringOperator.VStemHM,
                    this.state.allArgs()
                );
            case CharStringOperator.HintMask:
            case CharStringOperator.CntrMask:
                this.doStemHint(this.sink.stemQuantity > 0, this.state.allArgs());
                const flags = this.fnPullFlags();
                return this.sink.addHintMask(opCode === CharStringOperator.CntrMask, flags);

            case CharStringOperator.RMoveTo:
            case CharStringOperator.HMoveTo:
            case CharStringOperator.VMoveTo:
                return this.doMove(
                    opCode === CharStringOperator.HMoveTo,
                    opCode === CharStringOperator.VMoveTo
                );

            // Graphics
            case CharStringOperator.RLineTo:
                return this.doRLineTo(this.state.allArgs());
            case CharStringOperator.HLineTo:
                return this.doHLineTo(this.state.allArgs());
            case CharStringOperator.VLineTo:
                return this.doVLineTo(this.state.allArgs());
            case CharStringOperator.RRCurveTo:
                return this.doRRCurveTo(this.state.allArgs());
            case CharStringOperator.RCurveLine:
                return this.doRCurveLine(this.state.allArgs());
            case CharStringOperator.RLineCurve:
                return this.doRLineCurve(this.state.allArgs());
            case CharStringOperator.HHCurveTo:
                return this.doHHCurveTo(this.state.allArgs());
            case CharStringOperator.VVCurveTo:
                return this.doVVCurveTo(this.state.allArgs());
            case CharStringOperator.HVCurveTo:
                return this.doHVCurveTo(this.state.allArgs());
            case CharStringOperator.VHCurveTo:
                return this.doVHCurveTo(this.state.allArgs());
            case CharStringOperator.Flex:
                return this.doFlex(this.state.allArgs(12));
            case CharStringOperator.HFlex:
                return this.doHFlex(this.state.allArgs(7));
            case CharStringOperator.Flex1:
                return this.doFlex1(this.state.allArgs(11));
            case CharStringOperator.HFlex1:
                return this.doHFlex1(this.state.allArgs(11));

            // Logic
            case CharStringOperator.And:
                return this.doAnd();
            case CharStringOperator.Or:
                return this.doOr();
            case CharStringOperator.Not:
                return this.doNot();
            case CharStringOperator.Eq:
                return this.doEq();

            // Arith
            case CharStringOperator.Add:
                return this.doAdd();
            case CharStringOperator.Sub:
                return this.doSub();
            case CharStringOperator.Neg:
                return this.doNeg();
            case CharStringOperator.Abs:
                return this.doAbs();
            case CharStringOperator.Mul:
                return this.doMul();
            case CharStringOperator.Div:
                return this.doDiv();
            case CharStringOperator.Sqrt:
                return this.doSqrt();
            case CharStringOperator.Random:
                return this.doRandom();

            // Stack manipulation
            case CharStringOperator.Dup:
                return this.doDup();
            case CharStringOperator.Exch:
                return this.doExch();
            case CharStringOperator.Index:
                return this.doIndex();
            case CharStringOperator.Roll:
                return this.doRoll();
            case CharStringOperator.Drop:
                return this.doDrop();

            // Memory
            case CharStringOperator.Put:
                return this.doPut();
            case CharStringOperator.Get:
                return this.doGet();

            // Flow control
            case CharStringOperator.IfElse:
                return this.doConditional();
            case CharStringOperator.CallSubr:
            case CharStringOperator.CallGSubr:
                const subr = OtVar.Ops.originOf(this.state.pop());
                const buf =
                    opCode === CharStringOperator.CallSubr
                        ? this.getLocalSubroutine(subr)
                        : this.getGlobalSubroutine(subr);
                this.halt = callCharString(buf, this.state, this.subroutines, this.sink);
                return;
            case CharStringOperator.Return:
                return this.doReturn();
            case CharStringOperator.EndChar:
                return this.doEndChar();
            default:
                return Errors.Cff.OperatorNotSupported(opCode);
        }
    }

    // Hinting
    private doStemHint(isVertical: boolean, args: OtVar.Value[]) {
        if (args.length % 2) {
            this.sink.setWidth(OtVar.Ops.add(this.subroutines.nominalWidthX, args[0]));
        }
        this.sink.stemQuantity += args.length >> 1;
        let hintBase: OtVar.Value = 0;
        for (let argId = args.length % 2; argId < args.length; argId += 2) {
            const startEdge = OtVar.Ops.add(hintBase, args[argId]);
            const endEdge = OtVar.Ops.add(startEdge, args[argId + 1]);
            this.sink.addStemHint(isVertical, startEdge, endEdge);
            hintBase = endEdge;
        }
    }

    // Graphics Functions
    private doMove(isH: boolean, isV: boolean) {
        this.sink.startContour();
        if (!isH && !isV) {
            const [dx, dy] = this.state.args(2);
            this.sink.lineTo(dx, dy);
        } else {
            const [d] = this.state.args(1);
            if (isH) this.sink.lineTo(d, 0);
            else this.sink.lineTo(0, d);
        }
        if (this.state.stackHeight()) {
            this.sink.setWidth(OtVar.Ops.add(this.subroutines.nominalWidthX, this.state.pop()));
        }
        this.state.allArgs();
    }
    private doRLineTo(args: OtVar.Value[]) {
        for (let index = 0; index < args.length; index += 2) {
            this.sink.lineTo(args[index], args[index + 1]);
        }
    }
    private doVLineTo(args: OtVar.Value[]) {
        if (args.length % 2 === 1) {
            this.sink.lineTo(0.0, args[0]);
            for (let index = 1; index < args.length; index += 2) {
                this.sink.lineTo(args[index], 0.0);
                this.sink.lineTo(0.0, args[index + 1]);
            }
        } else {
            for (let index = 0; index < args.length; index += 2) {
                this.sink.lineTo(0.0, args[index]);
                this.sink.lineTo(args[index + 1], 0.0);
            }
        }
    }
    private doHLineTo(args: OtVar.Value[]) {
        if (args.length % 2 === 1) {
            this.sink.lineTo(args[0], 0);
            for (let index = 1; index < args.length; index += 2) {
                this.sink.lineTo(0, args[index]);
                this.sink.lineTo(args[index + 1], 0);
            }
        } else {
            for (let index = 0; index < args.length; index += 2) {
                this.sink.lineTo(args[index], 0);
                this.sink.lineTo(0, args[index + 1]);
            }
        }
    }
    private doRRCurveTo(args: OtVar.Value[]) {
        for (let index = 0; index < args.length; index += 6) {
            this.sink.curveTo(
                args[index],
                args[index + 1],
                args[index + 2],
                args[index + 3],
                args[index + 4],
                args[index + 5]
            );
        }
    }
    private doRCurveLine(args: OtVar.Value[]) {
        for (let index = 0; index < args.length - 2; index += 6) {
            this.sink.curveTo(
                args[index],
                args[index + 1],
                args[index + 2],
                args[index + 3],
                args[index + 4],
                args[index + 5]
            );
        }
        this.sink.lineTo(args[args.length - 2], args[args.length - 1]);
    }
    private doRLineCurve(args: OtVar.Value[]) {
        for (let index = 0; index < args.length - 6; index += 2) {
            this.sink.lineTo(args[index], args[index + 1]);
        }
        {
            this.sink.curveTo(
                args[args.length - 6],
                args[args.length - 5],
                args[args.length - 4],
                args[args.length - 3],
                args[args.length - 2],
                args[args.length - 1]
            );
        }
    }
    private doVVCurveTo(args: OtVar.Value[]) {
        if (args.length % 4 === 1) {
            this.sink.curveTo(args[0], args[1], args[2], args[3], 0.0, args[4]);
            for (let index = 5; index < args.length; index += 4) {
                this.sink.curveTo(
                    0.0,
                    args[index],
                    args[index + 1],
                    args[index + 2],
                    0.0,
                    args[index + 3]
                );
            }
        } else {
            for (let index = 0; index < args.length; index += 4) {
                this.sink.curveTo(
                    0.0,
                    args[index],
                    args[index + 1],
                    args[index + 2],
                    0.0,
                    args[index + 3]
                );
            }
        }
    }
    private doHHCurveTo(args: OtVar.Value[]) {
        if (args.length % 4 === 1) {
            this.sink.curveTo(args[1], args[0], args[2], args[3], args[4], 0.0);
            for (let index = 5; index < args.length; index += 4) {
                this.sink.curveTo(
                    args[index],
                    0.0,
                    args[index + 1],
                    args[index + 2],
                    args[index + 3],
                    0.0
                );
            }
        } else {
            for (let index = 0; index < args.length; index += 4) {
                this.sink.curveTo(
                    args[index],
                    0.0,
                    args[index + 1],
                    args[index + 2],
                    args[index + 3],
                    0.0
                );
            }
        }
    }
    private doVHCurveTo(args: OtVar.Value[]) {
        const bezierCount = args.length % 4 === 1 ? (args.length - 5) / 4 : args.length / 4;

        for (let index = 0; index < 4 * bezierCount; index += 4) {
            if ((index / 4) % 2 === 0) {
                this.sink.curveTo(
                    0.0,
                    args[index],
                    args[index + 1],
                    args[index + 2],
                    args[index + 3],
                    0.0
                );
            } else {
                this.sink.curveTo(
                    args[index],
                    0.0,
                    args[index + 1],
                    args[index + 2],
                    0.0,
                    args[index + 3]
                );
            }
        }
        if (args.length % 8 === 5) {
            this.sink.curveTo(
                0.0,
                args[args.length - 5],
                args[args.length - 4],
                args[args.length - 3],
                args[args.length - 2],
                args[args.length - 1]
            );
        } else if (args.length % 8 === 1) {
            this.sink.curveTo(
                args[args.length - 5],
                0.0,
                args[args.length - 4],
                args[args.length - 3],
                args[args.length - 1],
                args[args.length - 2]
            );
        }
    }
    private doHVCurveTo(args: OtVar.Value[]) {
        const bezierCount = args.length % 4 === 1 ? (args.length - 5) / 4 : args.length / 4;

        for (let index = 0; index < 4 * bezierCount; index += 4) {
            if ((index / 4) % 2 === 0) {
                this.sink.curveTo(
                    args[index],
                    0.0,
                    args[index + 1],
                    args[index + 2],
                    0.0,
                    args[index + 3]
                );
            } else {
                this.sink.curveTo(
                    0.0,
                    args[index],
                    args[index + 1],
                    args[index + 2],
                    args[index + 3],
                    0.0
                );
            }
        }

        if (args.length % 8 === 5) {
            this.sink.curveTo(
                args[args.length - 5],
                0.0,
                args[args.length - 4],
                args[args.length - 3],
                args[args.length - 1],
                args[args.length - 2]
            );
        } else if (args.length % 8 === 1) {
            this.sink.curveTo(
                0.0,
                args[args.length - 5],
                args[args.length - 4],
                args[args.length - 3],
                args[args.length - 2],
                args[args.length - 1]
            );
        }
    }
    private doFlex(args: OtVar.Value[]) {
        this.sink.curveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
        this.sink.curveTo(args[6], args[7], args[8], args[9], args[10], args[11]);
    }
    private doHFlex(args: OtVar.Value[]) {
        this.sink.curveTo(args[0], 0.0, args[1], args[2], args[3], 0.0);
        this.sink.curveTo(args[4], 0.0, args[5], -args[2], args[6], 0.0);
    }
    private doHFlex1(args: OtVar.Value[]) {
        this.sink.curveTo(args[0], args[1], args[2], args[3], args[4], 0.0);
        this.sink.curveTo(
            args[5],
            0.0,
            args[6],
            args[7],
            args[8],
            OtVar.Ops.negate(OtVar.Ops.add(OtVar.Ops.add(args[1], args[3]), args[7]))
        );
    }
    private doFlex1(args: OtVar.Value[]) {
        let dx: OtVar.Value = OtVar.Ops.sum(args[0], args[2], args[4], args[6], args[8]);
        let dy: OtVar.Value = OtVar.Ops.sum(args[1], args[3], args[5], args[7], args[9]);

        // Note: we assume that this condition won't change during variation
        if (Math.abs(OtVar.Ops.originOf(dx)) > Math.abs(OtVar.Ops.originOf(dy))) {
            dx = args[10];
            dy = OtVar.Ops.negate(dy);
        } else {
            dx = OtVar.Ops.negate(dx);
            dy = args[10];
        }
        this.sink.curveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
        this.sink.curveTo(args[6], args[7], args[8], args[9], dx, dy);
    }

    // LOGIC
    private doAnd() {
        const [a, b] = this.state.args(2);
        this.state.push(OtVar.Ops.originOf(a) && OtVar.Ops.originOf(b) ? 1 : 0);
    }
    private doOr() {
        const [a, b] = this.state.args(2);
        this.state.push(OtVar.Ops.originOf(a) || OtVar.Ops.originOf(b) ? 1 : 0);
    }
    private doNot() {
        const a = this.state.pop();
        this.state.push(!OtVar.Ops.originOf(a) ? 1 : 0);
    }
    private doEq() {
        const [a, b] = this.state.args(2);
        const diff = OtVar.Ops.minus(b, a);
        this.state.push(OtVar.Ops.originOf(diff) ? 1 : 0);
    }

    // ARITH
    private doAbs() {
        const a = this.state.pop();
        this.state.push(Math.abs(OtVar.Ops.originOf(a)));
    }
    private doAdd() {
        const [a, b] = this.state.args(2);
        this.state.push(OtVar.Ops.add(a, b));
    }
    private doSub() {
        const [a, b] = this.state.args(2);
        this.state.push(OtVar.Ops.minus(a, b));
    }
    private doNeg() {
        const a = this.state.pop();
        this.state.push(OtVar.Ops.negate(a));
    }
    private doMul() {
        const [a, b] = this.state.args(2);
        if (OtVar.Ops.isConstant(a)) {
            this.state.push(OtVar.Ops.scale(OtVar.Ops.originOf(a), b));
        } else if (OtVar.Ops.isConstant(b)) {
            this.state.push(OtVar.Ops.scale(OtVar.Ops.originOf(b), a));
        } else {
            this.state.push(OtVar.Ops.originOf(a) * OtVar.Ops.originOf(b));
        }
    }
    private doDiv() {
        const [a, b] = this.state.args(2);
        if (!OtVar.Ops.isConstant(b)) {
            this.state.push(OtVar.Ops.originOf(a) / OtVar.Ops.originOf(b));
        } else {
            this.state.push(OtVar.Ops.scale(1 / OtVar.Ops.originOf(b), a));
        }
    }
    private doSqrt() {
        const a = this.state.pop();
        this.state.push(Math.sqrt(OtVar.Ops.originOf(a)));
    }
    private doRandom() {
        this.state.push(this.state.getRandom());
    }

    // STACK MANIPULATION
    private doDrop() {
        this.state.pop();
    }
    private doDup() {
        const t = this.state.pop();
        this.state.push(t);
        this.state.push(t);
    }
    private doExch() {
        const [a, b] = this.state.args(2);
        this.state.push(a);
        this.state.push(b);
    }
    private doIndex() {
        const index = this.state.pop();
        this.state.push(this.state.topIndex(OtVar.Ops.originOf(index)));
    }
    private doRoll() {
        const [xRollN, xRollJ] = this.state.args(2);

        const rollJ = OtVar.Ops.originOf(xRollJ);
        const rollN = OtVar.Ops.originOf(xRollN);
        const len = this.state.stackHeight();
        const last = len - 1;
        const first = len - rollN;

        this.state.reverseStack(first, last);
        this.state.reverseStack(last - rollJ + 1, last);
        this.state.reverseStack(first, last - rollJ);
    }

    // MEMORY
    private doGet() {
        const index = this.state.pop();
        const v = this.state.transient[OtVar.Ops.originOf(index)];
        if (v === undefined) throw Errors.Cff.TransientInvalid(OtVar.Ops.originOf(index));
        this.state.push(v);
    }
    private doPut() {
        const [val, index] = this.state.args(2);
        this.state.transient[OtVar.Ops.originOf(index)] = val;
    }

    // FLOW CONTROL
    private doConditional() {
        const [s1, s2, v1, v2] = this.state.args(4);
        const diff = OtVar.Ops.minus(v1, v2);
        this.state.push(OtVar.Ops.originOf(diff) <= 0 ? s1 : s2);
    }
    private doEndChar() {
        if (this.state.stackHeight()) {
            this.sink.setWidth(OtVar.Ops.add(this.subroutines.nominalWidthX, this.state.pop()));
        }
        this.state.allArgs();
        this.halt = this.end = true;
    }
    private doReturn() {
        this.halt = true;
    }
    private getLocalSubroutine(n: number) {
        const bias = computeSubroutineBias(this.subroutines.local.length);
        const data = this.subroutines.local[bias + n];
        if (!data) throw Errors.Cff.SubroutineNotFound("local", n);
        return data;
    }
    private getGlobalSubroutine(n: number) {
        const bias = computeSubroutineBias(this.subroutines.global.length);
        const data = this.subroutines.global[bias + n];
        if (!data) throw Errors.Cff.SubroutineNotFound("global", n);
        return data;
    }
}

export function callCharString(
    buf: Buffer,
    st: CffStackMachine & CffCharStringInterpState,
    ss: CffSubroutineSource,
    ds: CffCharStringDataSink
) {
    st.log += "{ ";
    const irSource = new CharStringIrSource(new BinaryView(buf), buf.byteLength);
    const interp = new CffCharStringInterpreter(
        () => irSource.pullMasks(ds.stemQuantity) || [],
        st,
        ss,
        ds
    );
    while (!interp.halt) {
        const ir = irSource.next();
        if (!ir) break;
        interp.next(ir);
    }
    st.log += "} ";
    return interp.end;
}

export function interpretCharString(
    buf: Buffer,
    st: CffStackMachine & CffCharStringInterpState,
    ss: CffSubroutineSource,
    ds: CffCharStringDataSink
) {
    ds.setWidth(ss.defaultWidthX);
    callCharString(buf, st, ss, ds);
}

export function computeSubroutineBias(cnt: number) {
    if (cnt < 1240) return 107;
    else if (cnt < 33900) return 1131;
    else return 32768;
}
