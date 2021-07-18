import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../../ot-glyph";

import * as Cff from "./table";

export interface CffCoGlyphs {
    cff: Cff.Table;
}
export interface CffCoGlyphsWithNaming extends CffCoGlyphs {
    cffGlyphNaming?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
}
