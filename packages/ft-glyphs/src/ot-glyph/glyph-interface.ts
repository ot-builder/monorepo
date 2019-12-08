import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

export interface OtGlyphInterface extends GeneralGlyph.GlyphT<OtGlyphInterface, OtVar.Value> {
    name?: string;
}
