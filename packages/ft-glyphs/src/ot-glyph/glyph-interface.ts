import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { GeneralGlyph } from "../general-glyph";

export interface OtGlyphInterface extends GeneralGlyph.GlyphT<OtGlyphInterface, OtVar.Value> {
    name?: Data.Maybe<string>;
}
