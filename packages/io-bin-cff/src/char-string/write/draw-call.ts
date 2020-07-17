import { Errors } from "@ot-builder/errors";
import { WriteTimeDelayValue, WriteTimeIVD } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { CffEncodingOptions, CffWriteContext } from "../../context/write";
import { CffOperator, CharStringOperator } from "../../interp/operator";

import { Mir, MirType } from "./mir";

export class CffDrawCallRawT<X> {
    constructor(
        public readonly args: readonly X[],
        public readonly operator: number,
        public readonly flags?: number[]
    ) {}
}

export class CffBlendPrimitive {
    constructor(
        public readonly ivd: WriteTimeIVD,
        public readonly origin: number,
        public readonly deltas: number[]
    ) {}
    public isZero() {
        if (this.origin !== 0) return false;
        if (this.ivd) {
            for (const delta of this.deltas) if (delta) return false;
        }
        return true;
    }
}

export class CffDrawCallRaw extends CffDrawCallRawT<OtVar.Value> {}

export class CffDrawCall extends CffDrawCallRawT<number | CffBlendPrimitive> {
    public stackRidge: number;
    public stackRise: number;
    constructor(
        public readonly ivd: WriteTimeIVD | null,
        args: readonly (number | CffBlendPrimitive)[],
        operator: number,
        flags?: number[]
    ) {
        super(args, operator, flags);
        let sp = 0,
            sr = 0;
        for (const arg of args) {
            if (typeof arg === "number") {
                sr = Math.max(sp + 1, sr);
            } else {
                sr = Math.max(sp + 1, sp + arg.deltas.length + 1, sr);
            }
            sp += 1;
        }
        this.stackRidge = sr;
        this.stackRise = sp;
    }

    public get masterCount() {
        return this.ivd ? this.ivd.masterIDs.length : 0;
    }

    // Raw to DC conversion
    private static seqFromRawSeqImpl(
        ctx: CffWriteContext,
        eo: CffEncodingOptions,
        from: CffDrawCallRawT<OtVar.Value>[]
    ) {
        const intermediate: CffDrawCallRawT<number | WriteTimeDelayValue>[] = [];
        const to: CffDrawCall[] = [];
        const col = ctx.ivs ? ctx.ivs.createCollector() : null;
        for (const dc of from) {
            const args: Array<number | WriteTimeDelayValue> = [];
            for (const arg of dc.args) {
                if (!col || OtVar.Ops.isConstant(arg)) {
                    args.push(OtVar.Ops.evaluate(arg, null));
                } else {
                    args.push(col.collect(arg));
                }
            }
            intermediate.push(new CffDrawCallRawT(args, dc.operator, dc.flags));
        }
        const ivd = col ? col.getIVD() : null;
        for (const dci of intermediate) {
            const args: (number | CffBlendPrimitive)[] = [];
            let hasBlend = false;
            for (const arg of dci.args) {
                if (typeof arg === "number") {
                    args.push(arg);
                } else if (!ivd) {
                    throw Errors.Unreachable();
                } else {
                    args.push(new CffBlendPrimitive(ivd, arg.origin, arg.resolve()));
                    hasBlend = true;
                }
            }
            if (hasBlend && ivd && eo.forceBlendToPleaseTtx) {
                for (let aid = 0; aid < args.length; aid++) {
                    const arg = args[aid];
                    if (typeof arg === "number") {
                        args[aid] = new CffBlendPrimitive(
                            ivd,
                            arg,
                            new Array(ivd.masterIDs.length).fill(0)
                        );
                    }
                }
            }
            to.push(new CffDrawCall(ivd, args, dci.operator, dci.flags));
        }
        if (ivd) {
            // Always emitting a VxIndex operator since we don't know what is the corresponded PD's
            // inherited VS index. The global optimizer should hide most of them into subroutines.
            to.unshift(new CffDrawCall(ivd, [ivd.outerIndex], eo.vsIndexOperator));
        }
        return to;
    }
    public static charStringSeqFromRawSeq(
        ctx: CffWriteContext,
        from: CffDrawCallRawT<OtVar.Value>[]
    ) {
        const eo: CffEncodingOptions = {
            ...ctx.getLimits(),
            vsIndexOperator: CharStringOperator.VsIndex,
            blendOperator: CharStringOperator.Blend
        };
        return this.seqFromRawSeqImpl(ctx, eo, from);
    }
    public static dictStringSeqFromRawSeq(
        ctx: CffWriteContext,
        from: CffDrawCallRawT<OtVar.Value>[]
    ) {
        const eo: CffEncodingOptions = {
            ...ctx.getLimits(),
            forceBlendToPleaseTtx: true,
            vsIndexOperator: CffOperator.VsIndex,
            blendOperator: CffOperator.Blend
        };
        return this.seqFromRawSeqImpl(ctx, eo, from);
    }

    // DC to Mir conversion
    private toMirImpl(eo: CffEncodingOptions, mirSeq: Mir[]) {
        const converter = new MirArgConverter(mirSeq, eo);
        for (const arg of this.args) converter.push(arg);
        converter.flush();
        mirSeq.push({
            type: MirType.Operator,
            opCode: this.operator,
            flags: this.flags,
            stackRidge: 0,
            stackRise: -converter.sp
        });
    }
    public static charStringSeqToMir(ctx: CffWriteContext, dcSeq: Iterable<CffDrawCall>) {
        const mirSeq: Mir[] = [];
        const eo: CffEncodingOptions = {
            ...ctx.getLimits(),
            vsIndexOperator: CharStringOperator.VsIndex,
            blendOperator: CharStringOperator.Blend
        };
        for (const dc of dcSeq) dc.toMirImpl(eo, mirSeq);
        return mirSeq;
    }
    public static dictSeqToMir(ctx: CffWriteContext, dcSeq: Iterable<CffDrawCall>) {
        const mirSeq: Mir[] = [];
        const eo: CffEncodingOptions = {
            ...ctx.getLimits(),
            vsIndexOperator: CffOperator.VsIndex,
            blendOperator: CffOperator.Blend
        };
        for (const dc of dcSeq) dc.toMirImpl(eo, mirSeq);
        return mirSeq;
    }
}

class MirArgConverter {
    public sp = 0;
    public pendingBlendOrigins: number[] = [];
    public pendingBlendDeltas: number[] = [];

    constructor(private to: Mir[], private readonly eo: CffEncodingOptions) {}

    public push(x: number | CffBlendPrimitive) {
        if (typeof x === "number") {
            this.flush();
            this.sp += 1;
            this.to.push(Mir.operand(x));
        } else {
            if (this.willOverflow(x)) this.flush();
            this.pendingBlendOrigins.push(x.origin);
            for (const d of x.deltas) this.pendingBlendDeltas.push(d);
        }
    }
    private willOverflow(x: CffBlendPrimitive) {
        return (
            this.sp +
                1 +
                this.pendingBlendDeltas.length +
                this.pendingBlendOrigins.length +
                1 +
                x.deltas.length >=
            this.eo.maxStack
        );
    }
    public flush() {
        if (this.pendingBlendOrigins.length) {
            for (const x of this.pendingBlendOrigins) this.to.push(Mir.operand(x));
            for (const x of this.pendingBlendDeltas) this.to.push(Mir.operand(x));
            this.to.push(Mir.operand(this.pendingBlendOrigins.length));
            this.to.push({
                type: MirType.Operator,
                opCode: this.eo.blendOperator,
                flags: undefined,
                stackRidge: 0,
                stackRise:
                    this.pendingBlendOrigins.length -
                    (1 + this.pendingBlendOrigins.length + this.pendingBlendDeltas.length)
            });
            this.sp += this.pendingBlendOrigins.length;
            this.pendingBlendOrigins.length = 0;
            this.pendingBlendDeltas.length = 0;
        }
    }
}
