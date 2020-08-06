import { NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Math as OtMath } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";

import { Ptr16MathGlyphConstruction } from "./glyph-construction";

export const MathVariants = {
    read(bv: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const minConnectorOverlap = bv.uint16();
        const covVertical = bv.next(Ptr16GidCoverage);
        const covHorizontal = bv.next(Ptr16GidCoverage);
        const vGlyphCount = bv.uint16();
        const hGlyphCount = bv.uint16();
        const vGlyphConstructions = bv.array(vGlyphCount, Ptr16MathGlyphConstruction, gOrd);
        const hGlyphConstructions = bv.array(hGlyphCount, Ptr16MathGlyphConstruction, gOrd);
        return new OtMath.Variants(
            minConnectorOverlap,
            new Map(CovUtils.mapFromNumbers(covVertical, vGlyphConstructions, gOrd)),
            new Map(CovUtils.mapFromNumbers(covHorizontal, hGlyphConstructions, gOrd))
        );
    },
    write(fr: Frag, mv: OtMath.Variants, gOrd: Data.Order<OtGlyph>) {
        const auxVertical = CovUtils.auxMapFromMap(mv.vertical || new Map(), gOrd);
        const auxHorizontal = CovUtils.auxMapFromMap(mv.horizontal || new Map(), gOrd);

        fr.uint16(OtVar.Ops.originOf(mv.minConnectorOverlap));
        fr.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(auxVertical));
        fr.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(auxHorizontal));
        fr.uint16(auxVertical.length);
        fr.uint16(auxHorizontal.length);
        fr.arrayN(
            Ptr16MathGlyphConstruction,
            auxVertical.length,
            CovUtils.valueListFromAuxMap(auxVertical),
            gOrd
        );
        fr.arrayN(
            Ptr16MathGlyphConstruction,
            auxHorizontal.length,
            CovUtils.valueListFromAuxMap(auxHorizontal),
            gOrd
        );
    }
};
export const Ptr16MathVariantsNullable = NullablePtr16(MathVariants);
