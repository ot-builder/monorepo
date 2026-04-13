import type { Data } from "@ot-builder/prelude";

import type { OtGlyph } from "../../ot-glyph";

import type * as Cff from "./table";

export interface CffCoGlyphs {
    cff: Cff.Table;
}
export interface CffCoGlyphsWithNaming extends CffCoGlyphs {
    cffGlyphNaming?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
}
