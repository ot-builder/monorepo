import { NonNullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";
import { MathValueRecord } from "../shared/math-value-record";

import { MathKernInfo } from "./kern";

export class GlyphValueMapIo<T> {
    constructor(private readonly ioProc: Read<T> & Write<T>) {}
    public read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const cov = bv.next(Ptr16GidCoverage);
        const count = bv.uint16();
        const values = bv.array(count, this.ioProc);
        return new Map(CovUtils.mapFromNumbers(cov, values, gOrd));
    }
    public write(fr: Frag, x: Map<OtGlyph, T>, gOrd: Data.Order<OtGlyph>) {
        const aux = CovUtils.auxMapFromMap(x, gOrd);
        fr.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(aux));
        fr.uint16(aux.length);
        fr.arrayN(this.ioProc, aux.length, CovUtils.valueListFromAuxMap(aux));
    }
}

export const GlyphMathValueRecordMap = new GlyphValueMapIo(MathValueRecord);
export const GlyphMathKernInfoMap = new GlyphValueMapIo(MathKernInfo);
export const Ptr16GlyphMathValueRecordMap = NonNullablePtr16(GlyphMathValueRecordMap);
export const Ptr16GlyphMathKernInfoMap = NonNullablePtr16(GlyphMathKernInfoMap);
