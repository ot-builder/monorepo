import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Math as OtMath } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import { Ptr16MathConstantsNullable } from "./constants";
import { Ptr16MathGlyphInfoNullable } from "./glyph-info";
import { Ptr16MathVariantsNullable } from "./variants";

export const MathTableIo = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const majorVersion = bv.uint16();
        const minorVersion = bv.uint16();
        Assert.SubVersionSupported("MathTable", majorVersion, minorVersion, [1, 0]);
        const mathConstants = bv.next(Ptr16MathConstantsNullable);
        const mathGlyphInfo = bv.next(Ptr16MathGlyphInfoNullable, gOrd);
        const mathVariants = bv.next(Ptr16MathVariantsNullable, gOrd);
        return new OtMath.Table(mathConstants, mathGlyphInfo, mathVariants);
    },
    write(fr: Frag, math: OtMath.Table, gOrd: Data.Order<OtGlyph>) {
        fr.uint16(1).uint16(0);
        fr.push(Ptr16MathConstantsNullable, math.constants);
        fr.push(Ptr16MathGlyphInfoNullable, math.glyphInfo, gOrd);
        fr.push(Ptr16MathVariantsNullable, math.variants, gOrd);
    }
};
