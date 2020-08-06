import { NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Math as OtMath } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import { NullablePtr16GlyphCoverage } from "../shared/coverage";

import { Ptr16GlyphMathKernInfoMap, Ptr16GlyphMathValueRecordMap } from "./glyph-value-map";

export const MathGlyphInfo = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const mathItalicsCorrection = bv.next(Ptr16GlyphMathValueRecordMap, gOrd);
        const topAccentAttachment = bv.next(Ptr16GlyphMathValueRecordMap, gOrd);
        const extendedShapes = bv.next(NullablePtr16GlyphCoverage, gOrd);
        const kernInfo = bv.next(Ptr16GlyphMathKernInfoMap, gOrd);
        return new OtMath.GlyphInfo(
            mathItalicsCorrection,
            topAccentAttachment,
            extendedShapes,
            kernInfo
        );
    },
    write(fr: Frag, gi: OtMath.GlyphInfo, gOrd: Data.Order<OtGlyph>) {
        fr.push(Ptr16GlyphMathValueRecordMap, gi.italicCorrections, gOrd);
        fr.push(Ptr16GlyphMathValueRecordMap, gi.topAccentAttachments, gOrd);
        fr.push(NullablePtr16GlyphCoverage, gi.extendedShapes, gOrd);
        fr.push(Ptr16GlyphMathKernInfoMap, gi.kernInfos, gOrd);
    }
};
export const Ptr16MathGlyphInfoNullable = NullablePtr16(MathGlyphInfo);
