import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Cff } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffSubroutineIndex } from "../char-string/read/subroutine-index";
import { CffDrawCallRaw } from "../char-string/write/draw-call";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";
import { CffOperator } from "../interp/operator";

import { DictEncoder } from "./encoder";
import {
    CffDictDataCollector,
    CffDictInterpreterBase,
    CffDictReadT,
    CffDictWriteT
} from "./general";

class PrivateDictInterpreter extends CffDictInterpreterBase {
    constructor(private ctx: CffReadContext, private viewDict: BinaryView) {
        super(ctx.ivs);
    }

    private result = new Cff.PrivateDict();

    protected doOperator(opCode: number, flags?: Data.Maybe<number[]>) {
        switch (opCode) {
            case CffOperator.VsIndex:
                const vsIndex = this.st.doVsIndex();
                this.result.inheritedVsIndex = vsIndex;
                return vsIndex;
            case CffOperator.Blend:
                return this.st.doBlend();
            case CffOperator.Subrs:
                const vwPrivateSubrs = this.viewDict.lift(OtVar.Ops.originOf(this.st.pop()));
                this.result.localSubroutines = vwPrivateSubrs.next(CffSubroutineIndex, this.ctx);
                break;
            case CffOperator.BlueValues:
                this.result.blueValues = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.OtherBlues:
                this.result.otherBlues = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.FamilyBlues:
                this.result.familyBlues = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.FamilyOtherBlues:
                this.result.familyOtherBlues = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.BlueScale:
                this.result.blueScale = this.st.pop();
                break;
            case CffOperator.BlueShift:
                this.result.blueShift = this.st.pop();
                break;
            case CffOperator.BlueFuzz:
                this.result.blueFuzz = this.st.pop();
                break;
            case CffOperator.StdHW:
                this.result.stdHW = this.st.pop();
                break;
            case CffOperator.StdVW:
                this.result.stdVW = this.st.pop();
                break;
            case CffOperator.StemSnapH:
                this.result.stemSnapH = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.StemSnapV:
                this.result.stemSnapV = this.st.accumulate(this.st.allArgs());
                break;
            case CffOperator.LanguageGroup:
                this.result.languageGroup = OtVar.Ops.originOf(this.st.pop());
                break;
            case CffOperator.ExpansionFactor:
                this.result.expansionFactor = this.st.pop();
                break;
            case CffOperator.defaultWidthX:
                this.result.defaultWidthX = OtVar.Ops.originOf(this.st.pop());
                break;
            case CffOperator.nominalWidthX:
                this.result.nominalWidthX = OtVar.Ops.originOf(this.st.pop());
                break;
            default:
                throw Errors.Cff.OperatorNotSupported(opCode);
        }
    }

    public getResult() {
        return this.result;
    }
}

class PrivateDictDataCollector extends CffDictDataCollector<Cff.PrivateDict> {
    private *emitDeltas(vs: OtVar.Value[], op: CffOperator) {
        if (!vs.length) return;
        let a: OtVar.Value = 0;
        let deltas: OtVar.Value[] = [];
        for (const v of vs) {
            const d = OtVar.Ops.minus(v, a);
            deltas.push(d);
            a = v;
        }
        yield new CffDrawCallRaw(deltas, op);
    }

    private *emitNumber(q: OtVar.Value, defaultQ: OtVar.Value, op: CffOperator) {
        if (OtVar.Ops.equal(q, defaultQ, 1 / 0x10000)) return;
        yield new CffDrawCallRaw([q], op);
    }

    public *collectDrawCalls(pd: Cff.PrivateDict, ctx: CffWriteContext, rest: void) {
        // Blue zones ("deltas" in spec)
        yield* this.emitDeltas(pd.blueValues, CffOperator.BlueValues);
        yield* this.emitDeltas(pd.otherBlues, CffOperator.OtherBlues);
        yield* this.emitDeltas(pd.familyBlues, CffOperator.FamilyBlues);
        yield* this.emitDeltas(pd.familyOtherBlues, CffOperator.FamilyOtherBlues);
        yield* this.emitDeltas(pd.stemSnapH, CffOperator.StemSnapH);
        yield* this.emitDeltas(pd.stemSnapV, CffOperator.StemSnapV);

        // Numeric fields
        const defaultPd = new Cff.PrivateDict();
        yield* this.emitNumber(pd.blueScale, defaultPd.blueScale, CffOperator.BlueScale);
        yield* this.emitNumber(pd.blueShift, defaultPd.blueShift, CffOperator.BlueShift);
        yield* this.emitNumber(pd.blueFuzz, defaultPd.blueFuzz, CffOperator.BlueFuzz);
        yield* this.emitNumber(pd.stdHW, defaultPd.stdHW, CffOperator.StdHW);
        yield* this.emitNumber(pd.stdVW, defaultPd.stdVW, CffOperator.StdVW);
        yield* this.emitNumber(
            pd.expansionFactor,
            defaultPd.expansionFactor,
            CffOperator.ExpansionFactor
        );
        yield* this.emitNumber(
            pd.languageGroup,
            defaultPd.languageGroup,
            CffOperator.LanguageGroup
        );
    }

    public processPointers(
        encoder: DictEncoder,
        pd: Cff.PrivateDict,
        ctx: CffWriteContext,
        rest: void
    ) {
        if (pd.localSubroutines) {
            encoder.embRelPointer(
                new Frag().push(CffSubroutineIndex, pd.localSubroutines, ctx),
                CffOperator.Subrs
            );
        }
    }
}

export const CffPrivateDictIo = {
    ...CffDictReadT<Cff.PrivateDict>(
        (viewDict, ctx) => new PrivateDictInterpreter(ctx, viewDict.lift(0))
    ),
    ...CffDictWriteT<Cff.PrivateDict>(new PrivateDictDataCollector())
};
