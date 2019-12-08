import { Caster } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

import { OtGlyphInterface } from "./glyph-interface";

export const TID_Glyph = new Caster.TypeID<OtGlyphInterface>("OtBuilder::OtGlyph::Glyph");
export const TID_ContourSet = new Caster.TypeID<
    GeneralGlyph.ContourSetT<OtGlyphInterface, OtVar.Value>
>("OtBuilder::OtGlyph::ContourSet");
export const TID_GeometryList = new Caster.TypeID<
    GeneralGlyph.GeometryListT<OtGlyphInterface, OtVar.Value>
>("OtBuilder::OtGlyph::GeometryList");
export const TID_TtReference = new Caster.TypeID<
    GeneralGlyph.TtReferenceT<OtGlyphInterface, OtVar.Value>
>("OtBuilder::OtGlyph::TtReference");
export const TID_TtInstructionHint = new Caster.TypeID<
    GeneralGlyph.TtInstructionHintT<OtVar.Value>
>("OtBuilder::OtGlyph::TtInstructionHint");
export const TID_CffHint = new Caster.TypeID<GeneralGlyph.CffHintT<OtVar.Value>>(
    "OtBuilder::OtGlyph::CffHint"
);
