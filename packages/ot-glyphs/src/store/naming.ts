import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";

export interface OtGlyphNamingSource {
    readonly post?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
    readonly cff?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
    readonly encoding?: Data.Maybe<Data.Naming.IndexSource<OtGlyph>>;
}

export interface OtGlyphNamer {
    nameGlyph(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph): string;
}
