import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS } from "@ot-builder/var-store";

import { CffDrawCall, CffDrawCallRaw } from "../char-string/write/draw-call";
import { Mir } from "../char-string/write/mir";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";
import { CffInterp } from "../interp/ir";
import { CffDictIrSource } from "../interp/ir-source";
import { CffStackMachine } from "../interp/stack-machine";

import { DictEncoder } from "./encoder";

export type CffDictInterpreterFactory<T> = (
    viewDict: BinaryView,
    ctx: CffReadContext
) => CffInterp.Interpreter & CffDictInterpreter<T>;

export interface CffDictInterpreter<T> {
    getResult(): T;
}

export abstract class CffDictInterpreterBase extends CffInterp.Interpreter {
    public st: CffStackMachine;
    constructor(ivs?: Data.Maybe<ReadTimeIVS>) {
        super();
        this.st = new CffStackMachine(ivs);
    }
    public doOperand(x: number) {
        this.st.push(x);
    }
}

export function CffDictReadT<T>(interpFactory: CffDictInterpreterFactory<T>) {
    return Read(function(view: BinaryView, ctx: CffReadContext, dictSize: number) {
        const interp = interpFactory(view, ctx);
        const irSource = new CffDictIrSource(view, dictSize);
        for (;;) {
            const ir = irSource.next();
            if (!ir) break;
            else interp.next(ir);
        }
        return interp.getResult();
    });
}

export abstract class CffDictDataCollector<T, A = void> {
    public abstract collectDrawCalls(
        dict: T,
        ctx: CffWriteContext,
        rest: A
    ): Iterable<CffDrawCallRaw>;
    public abstract processPointers(
        encoder: DictEncoder,
        dict: T,
        ctx: CffWriteContext,
        rest: A
    ): void;
}

export function CffDictWriteT<T, A = void>(collector: CffDictDataCollector<T, A>) {
    return Write((frag: Frag, dict: T, ctx: CffWriteContext, rest: A) => {
        const drawCalls = CffDrawCall.dictStringSeqFromRawSeq(ctx, [
            ...collector.collectDrawCalls(dict, ctx, rest)
        ]);
        const dcIrSeq = Mir.toInterpIrSeq(CffDrawCall.dictSeqToMir(ctx, drawCalls));
        const encoder = new DictEncoder(frag);
        for (const ir of dcIrSeq) encoder.push(ir);
        collector.processPointers(encoder, dict, ctx, rest);
    });
}
