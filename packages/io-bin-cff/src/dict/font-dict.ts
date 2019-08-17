import { Frag, Read, Write } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Cff } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { OtVar, OV } from "@ot-builder/variance";

import { CffReadIndex } from "../cff-index/read";
import { CffWriteIndex } from "../cff-index/write";
import { CffDrawCallRaw } from "../char-string/write/draw-call";
import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";
import { CffOperator } from "../interp/operator";

import { DictEncoder } from "./encoder";
import {
    CffDictDataCollector,
    CffDictInterpreter,
    CffDictInterpreterBase,
    CffDictReadT,
    CffDictWriteT
} from "./general";
import { CffPrivateDictIo } from "./private-dict";

export class CffFontDictInterpreterBase extends CffDictInterpreterBase {
    constructor(protected ctx: CffReadContext) {
        super(null);
    }

    protected fd = new Cff.FontDict();

    protected popString() {
        const sid = OV.originOf(this.st.pop());
        if (!this.ctx.strings) throw Errors.Cff.StringsDisallowed();
        return this.ctx.strings.get(sid);
    }

    protected doOperator(opCode: number, flags?: Data.Maybe<number[]>) {
        switch (opCode) {
            // Strings
            case CffOperator.Version:
                this.fd.version = this.popString();
                break;
            case CffOperator.Notice:
                this.fd.notice = this.popString();
                break;
            case CffOperator.Copyright:
                this.fd.copyright = this.popString();
                break;
            case CffOperator.FullName:
                this.fd.fullName = this.popString();
                break;
            case CffOperator.FamilyName:
                this.fd.familyName = this.popString();
                break;
            case CffOperator.Weight:
                this.fd.weight = this.popString();
                break;

            // Numbers
            case CffOperator.IsFixedPitch:
                this.fd.isFixedPitch = !!OV.originOf(this.st.pop());
                break;
            case CffOperator.ItalicAngle:
                this.fd.italicAngle = OV.originOf(this.st.pop());
                break;
            case CffOperator.UnderlinePosition:
                this.fd.underlinePosition = OV.originOf(this.st.pop());
                break;
            case CffOperator.UnderlineThickness:
                this.fd.underlineThickness = OV.originOf(this.st.pop());
                break;
            case CffOperator.PaintType:
                this.fd.paintType = OV.originOf(this.st.pop());
                break;
            case CffOperator.CharStringType:
                this.st.pop();
                break;
            case CffOperator.StrokeWidth:
                this.fd.strokeWidth = OV.originOf(this.st.pop());
                break;

            // CID
            case CffOperator.FontName:
                this.fd.cidFontName = this.popString();
                break;
            case CffOperator.CIDFontVersion:
                this.fd.cidFontVersion = OV.originOf(this.st.pop());
                break;
            case CffOperator.CIDFontRevision:
                this.fd.cidFontRevision = OV.originOf(this.st.pop());
                break;
            case CffOperator.CIDFontType:
                this.fd.cidFontType = OV.originOf(this.st.pop());
                break;
            case CffOperator.CIDCount:
                this.fd.cidCount = OV.originOf(this.st.pop());
                break;

            // Unique ID, XUID, etc
            // Omit
            case CffOperator.UniqueID:
                this.st.pop();
                break;
            case CffOperator.XUID:
                this.st.allArgs();
                break;
            case CffOperator.UIDBase:
                this.st.pop();
                break;

            // BBox and FontMatrix
            // Omit, we don't need that
            case CffOperator.FontBBox:
                this.st.args(4);
                break;
            case CffOperator.FontMatrix:
                this.st.args(6);
                break;

            // Private dict
            case CffOperator.Private:
                const [vvSize, vvOffset] = this.st.args(2);
                this.fd.privateDict = this.ctx.vwCffTable
                    .lift(OV.originOf(vvOffset))
                    .next(CffPrivateDictIo, this.ctx, OV.originOf(vvSize));
                break;

            default:
                throw Errors.Cff.OperatorNotSupported(opCode);
        }
    }
}

export class CffFontDictInterpreter extends CffFontDictInterpreterBase
    implements CffDictInterpreter<Cff.FontDict> {
    public getResult() {
        return this.fd;
    }
}

export class CffFontDictDataCollector extends CffDictDataCollector<Cff.FontDict> {
    private *emitNum(q: OtVar.Value, defaultQ: OtVar.Value, op: CffOperator) {
        if (OV.equal(q, defaultQ, 1 / 0x10000)) return;
        yield new CffDrawCallRaw([q], op);
    }

    private *emitString(ctx: CffWriteContext, s: Data.Maybe<string>, op: CffOperator) {
        if (s && ctx.strings) {
            yield new CffDrawCallRaw([ctx.strings.push(s)], op);
        }
    }

    public *collectDrawCalls(pd: Cff.FontDict, ctx: CffWriteContext, rest: void) {
        // Strings
        yield* this.emitString(ctx, pd.version, CffOperator.Version);
        yield* this.emitString(ctx, pd.notice, CffOperator.Notice);
        yield* this.emitString(ctx, pd.copyright, CffOperator.Copyright);
        yield* this.emitString(ctx, pd.fullName, CffOperator.FullName);
        yield* this.emitString(ctx, pd.familyName, CffOperator.FamilyName);
        yield* this.emitString(ctx, pd.weight, CffOperator.Weight);
        yield* this.emitString(ctx, pd.cidFontName, CffOperator.FontName);

        // Numbers
        const emp = new Cff.FontDict();
        yield* this.emitNum(pd.isFixedPitch ? 1 : 0, 0, CffOperator.IsFixedPitch);
        yield* this.emitNum(pd.italicAngle, emp.italicAngle, CffOperator.ItalicAngle);
        yield* this.emitNum(
            pd.underlinePosition,
            emp.underlinePosition,
            CffOperator.UnderlinePosition
        );
        yield* this.emitNum(
            pd.underlineThickness,
            emp.underlineThickness,
            CffOperator.UnderlineThickness
        );
        yield* this.emitNum(pd.paintType, emp.paintType, CffOperator.PaintType);
        yield* this.emitNum(pd.charStringType, emp.charStringType, CffOperator.CharStringType);
        yield* this.emitNum(pd.strokeWidth, emp.strokeWidth, CffOperator.StrokeWidth);

        // CID
        yield* this.emitNum(pd.cidFontVersion, emp.cidFontVersion, CffOperator.CIDFontVersion);
        yield* this.emitNum(pd.cidFontRevision, emp.cidFontRevision, CffOperator.CIDFontRevision);
        yield* this.emitNum(pd.cidFontType, emp.cidFontType, CffOperator.CIDFontType);
        yield* this.emitNum(pd.cidCount, emp.cidCount, CffOperator.CIDCount);
    }

    public processPointers(
        encoder: DictEncoder,
        fd: Cff.FontDict,
        ctx: CffWriteContext,
        rest: void
    ) {
        if (fd.privateDict) {
            const frPrivateDict = Frag.from(CffPrivateDictIo, fd.privateDict, ctx, rest);
            encoder.operand(frPrivateDict.size);
            encoder.absPointer(frPrivateDict, CffOperator.Private);
        }
    }
}

export const CffFontDictIo = {
    ...CffDictReadT<Cff.FontDict>((vwDict, ctx) => new CffFontDictInterpreter(ctx)),
    ...CffDictWriteT<Cff.FontDict>(new CffFontDictDataCollector())
};

const CffFontDictIndexWrite = new CffWriteIndex({
    write: (f, fd: Cff.FontDict, ctx) => f.push(CffFontDictIo, fd, ctx, undefined)
});

export const CffFdArrayIo = {
    ...Read((view, ctx: CffReadContext) => {
        return view.next(
            new CffReadIndex({ read: (view, ctx, size) => view.next(CffFontDictIo, ctx, size) }),
            ctx
        );
    }),
    ...Write((frag, fdArray: Cff.FontDict[], ctx: CffWriteContext) => {
        return frag.push(CffFontDictIndexWrite, fdArray, ctx);
    })
};
