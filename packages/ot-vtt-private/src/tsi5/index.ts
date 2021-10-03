import { OtGlyph } from "@ot-builder/ot-glyphs";

export const Tag = "TSI5";
export enum CharacterGroup {
    Unknown = 0,
    Other = 1,
    Uppercase = 2,
    Lowercase = 3,
    Figure = 4,
    NonLatin = 5
}
export class Table {
    public charGroupFlags: Map<OtGlyph, number> = new Map();
}
