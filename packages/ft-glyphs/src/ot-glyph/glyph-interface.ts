import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

export interface OtGlyphInterface
    extends GeneralGlyph.GeometryT<OtGlyphInterface, OtVar.Value>,
        GeneralGlyph.GlyphT<OtGlyphInterface, OtVar.Value> {
    name?: string;
    acceptHintVisitor(hintVisitor: GeneralGlyph.HintVisitorT<OtVar.Value>): void;
}
