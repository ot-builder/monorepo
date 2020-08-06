import { NullablePtr16, NonNullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Math as OtMath } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { MathValueRecord } from "../shared/math-value-record";

const MathGlyphVariantRecord = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const gid = bv.uint16();
        const measurement = bv.uint16();
        return new OtMath.GlyphVariantRecord(gOrd.at(gid), measurement);
    },
    write(fr: Frag, gvr: OtMath.GlyphVariantRecord, gOrd: Data.Order<OtGlyph>) {
        fr.uint16(gOrd.reverse(gvr.variantGlyph));
        fr.uint16(OtVar.Ops.originOf(gvr.advanceMeasurement));
    }
};
const MathGlyphPartRecord = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const gid = bv.uint16();
        const startConnectorLength = bv.uint16();
        const endConnectorLength = bv.uint16();
        const fullAdvance = bv.uint16();
        const partFlags = bv.uint16();
        return new OtMath.GlyphPart(
            gOrd.at(gid),
            startConnectorLength,
            endConnectorLength,
            fullAdvance,
            partFlags
        );
    },
    write(fr: Frag, gp: OtMath.GlyphPart, gOrd: Data.Order<OtGlyph>) {
        fr.uint16(gOrd.reverse(gp.partGlyph));
        fr.uint16(OtVar.Ops.originOf(gp.startConnectorLength));
        fr.uint16(OtVar.Ops.originOf(gp.endConnectorLength));
        fr.uint16(OtVar.Ops.originOf(gp.fullAdvance));
        fr.uint16(gp.flags);
    }
};

const MathGlyphAssembly = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const italicCorrection = bv.next(MathValueRecord);
        const partCount = bv.uint16();
        const parts = bv.array(partCount, MathGlyphPartRecord, gOrd);
        return new OtMath.GlyphAssembly(italicCorrection, parts);
    },
    write(fr: Frag, ga: OtMath.GlyphAssembly, gOrd: Data.Order<OtGlyph>) {
        fr.push(MathValueRecord, ga.italicCorrection);
        fr.uint16(ga.parts.length);
        fr.array(MathGlyphPartRecord, ga.parts, gOrd);
    }
};
const Ptr16MathGlyphAssemblyNullable = NullablePtr16(MathGlyphAssembly);

export const MathGlyphConstruction = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const glyphAssembly = bv.next(Ptr16MathGlyphAssemblyNullable, gOrd);
        const variantCount = bv.uint16();
        const mathGlyphVariantRecords = bv.array(variantCount, MathGlyphVariantRecord, gOrd);
        return new OtMath.GlyphConstruction(glyphAssembly, mathGlyphVariantRecords);
    },
    write(fr: Frag, gc: OtMath.GlyphConstruction, gOrd: Data.Order<OtGlyph>) {
        fr.push(Ptr16MathGlyphAssemblyNullable, gc.assembly, gOrd);
        fr.uint16(gc.variants.length);
        fr.array(MathGlyphVariantRecord, gc.variants, gOrd);
    }
};
export const Ptr16MathGlyphConstruction = NonNullablePtr16(MathGlyphConstruction);
