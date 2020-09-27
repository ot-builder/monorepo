import { BinaryView, Frag, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Cff } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CffWriteIndex } from "../cff-index/write";
import { CffDrawCallRaw } from "../char-string/write/draw-call";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";
import { CffOperator } from "../interp/operator";

import { DictEncoder } from "./encoder";
import { CffFontDictDataCollector, CffFontDictInterpreterBase } from "./font-dict";
import { CffDictDataCollector, CffDictInterpreter, CffDictReadT, CffDictWriteT } from "./general";

export class CffTopDictInterpreter
    extends CffFontDictInterpreterBase
    implements CffDictInterpreter<CffTopDictRead> {
    constructor(ctx: CffReadContext) {
        super(ctx);
        this.td = new CffTopDictRead(this.fd);
    }

    private td: CffTopDictRead;

    protected doOperator(opCode: number, flags?: Data.Maybe<number[]>) {
        switch (opCode) {
            case CffOperator.CharStrings:
                this.td.vCharStrings = this.ctx.vwCffTable.lift(OtVar.Ops.originOf(this.st.pop()));
                break;
            case CffOperator.FDArray:
                this.td.vFDArray = this.ctx.vwCffTable.lift(OtVar.Ops.originOf(this.st.pop()));
                break;
            case CffOperator.FDSelect:
                this.td.vFDSelect = this.ctx.vwCffTable.lift(OtVar.Ops.originOf(this.st.pop()));
                break;
            case CffOperator.VStore:
                this.td.vVarStore = this.ctx.vwCffTable.lift(OtVar.Ops.originOf(this.st.pop()));
                break;
            case CffOperator.Charset:
                this.td.vCharSet = this.ctx.vwCffTable.lift(OtVar.Ops.originOf(this.st.pop()));
                break;
            case CffOperator.Encoding:
                this.st.pop(); // Ignore
                break;
            case CffOperator.ROS: {
                const cid = new Cff.CID();
                cid.supplement = OtVar.Ops.originOf(this.st.pop());
                cid.ordering = this.popString();
                cid.registry = this.popString();
                this.td.cidROS = cid;
                break;
            }
            default:
                return super.doOperator(opCode, flags);
        }
    }

    public getResult() {
        return this.td;
    }
}

export class CffTopDictDataCollector extends CffDictDataCollector<CffTopDictWrite, void> {
    public fdDC = new CffFontDictDataCollector();

    public *collectDrawCalls(td: CffTopDictWrite, ctx: CffWriteContext, rest: void) {
        if (td.cidROS) {
            if (!ctx.strings) throw Errors.Cff.ShouldHaveStrings();
            yield new CffDrawCallRaw(
                [
                    ctx.strings.push(td.cidROS.registry),
                    ctx.strings.push(td.cidROS.ordering),
                    td.cidROS.supplement
                ],
                CffOperator.ROS
            );
        }
        yield* this.fdDC.collectDrawCalls(td.fd, ctx, rest);
        if (ctx.version <= 1) {
            const bBox = ctx.stat.fontBBox.getResult();
            yield new CffDrawCallRaw(
                [bBox.xMin, bBox.yMin, bBox.xMax, bBox.yMax],
                CffOperator.FontBBox
            );
        }
        if (ctx.upm !== 1000) {
            yield new CffDrawCallRaw(
                [1 / ctx.upm, 0, 0, 1 / ctx.upm, 0, 0],
                CffOperator.FontMatrix
            );
        }
    }

    public processPointers(
        encoder: DictEncoder,
        td: CffTopDictWrite,
        ctx: CffWriteContext,
        rest: void
    ) {
        this.fdDC.processPointers(encoder, td.fd, ctx, rest);
        if (td.fgVarStore) encoder.absPointer(td.fgVarStore, CffOperator.VStore);
        if (td.fgCharSet) encoder.absPointer(td.fgCharSet, CffOperator.Charset);
        if (td.fgCharStrings) encoder.absPointer(td.fgCharStrings, CffOperator.CharStrings);
        if (td.fgFDSelect) encoder.absPointer(td.fgFDSelect, CffOperator.FDSelect);
        if (td.fgFDArray) encoder.absPointer(td.fgFDArray, CffOperator.FDArray);
    }
}

export class CffTopDictRead {
    constructor(public fd: Cff.FontDict) {}
    public cidROS: null | Cff.CID = null;
    public vCharStrings: null | BinaryView = null;
    public vFDArray: null | BinaryView = null;
    public vFDSelect: null | BinaryView = null;
    public vVarStore: null | BinaryView = null;
    public vCharSet: null | BinaryView = null;
    public vEncoding: null | BinaryView = null;
}

export class CffTopDictWrite {
    constructor(public fd: Cff.FontDict) {}

    public fgCharStrings: null | Frag = null;
    public fgFDArray: null | Frag = null;
    public fgFDSelect: null | Frag = null;
    public fgVarStore: null | Frag = null;
    public fgCharSet: null | Frag = null;
    public cidROS: null | Cff.CID = null;
}

export const CffTopDictIo = {
    ...CffDictReadT((viewDict, ctx) => new CffTopDictInterpreter(ctx)),
    ...CffDictWriteT(new CffTopDictDataCollector())
};

const CffGeneralTopDictIndexWrite = new CffWriteIndex({
    write: (f, fd: CffTopDictWrite, ctx) => f.push(CffTopDictIo, fd, ctx, undefined)
});

export const CffTopDictIndexWrite = {
    ...Write((frag, td: CffTopDictWrite, ctx: CffWriteContext) => {
        return frag.push(CffGeneralTopDictIndexWrite, [td], ctx);
    })
};
