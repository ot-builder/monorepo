// TSI 01 and 23
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

export const TagTSI0 = "TSI0";
export const TagTSI1 = "TSI1";
export const TagTSI2 = "TSI2";
export const TagTSI3 = "TSI3";

export class Table {
    public glyphPrograms: Map<OtGlyph, string> = new Map();
    public preProgram?: Data.Maybe<string>;
    public cvtProgram?: Data.Maybe<string>;
    public fpgmProgram?: Data.Maybe<string>;
}
