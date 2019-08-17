import { CffWriteContext } from "../../../context/write";
import { CffBlendPrimitive, CffDrawCall } from "../draw-call";

export function argIsZero(x: number | CffBlendPrimitive) {
    if (typeof x === "number") return x === 0;
    else return x.isZero();
}

export abstract class DrawCallOptimizationPass<State> {
    constructor(protected ctx: CffWriteContext) {}

    protected state: State | null = null;
    protected abstract doFlush(state: State): Iterable<CffDrawCall>;
    protected abstract tryUpdateState(state: State, incoming: CffDrawCall): null | State;
    protected abstract tryInitState(incoming: CffDrawCall): null | State;

    public *update(dc: CffDrawCall) {
        if (this.state) {
            const s1Merge = this.tryUpdateState(this.state, dc);
            if (s1Merge) {
                this.state = s1Merge;
                return;
            } else {
                yield* this.doFlush(this.state);
            }
        }
        this.state = this.tryInitState(dc);
        if (!this.state) yield dc;
    }
    public *end() {
        if (this.state) yield* this.doFlush(this.state);
    }
}

export abstract class DrawCallOmit extends DrawCallOptimizationPass<boolean> {
    protected abstract match(dc: CffDrawCall): boolean;
    protected doFlush() {
        return [];
    }
    protected tryInitState(dc: CffDrawCall) {
        if (this.match(dc)) {
            return true;
        } else {
            return null;
        }
    }
    protected tryUpdateState() {
        return null;
    }
}

function* optimizePass(dcSeq: Iterable<CffDrawCall>, pass: DrawCallOptimizationPass<unknown>) {
    for (const dc of dcSeq) {
        yield* pass.update(dc);
    }
    yield* pass.end();
}

export function* cffOptimizeDrawCall(
    dcSeq: Iterable<CffDrawCall>,
    passes: DrawCallOptimizationPass<unknown>[]
): IterableIterator<CffDrawCall> {
    if (!passes.length) {
        yield* dcSeq;
    } else {
        const last = passes[passes.length - 1];
        const front = passes.slice(0, passes.length - 1);
        yield* optimizePass(cffOptimizeDrawCall(dcSeq, front), last);
    }
}
