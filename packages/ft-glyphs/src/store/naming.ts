import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";

export interface OtGlyphNamingSource {
    post?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
    cff?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
    encoding?: Data.Maybe<Data.Naming.IndexSource<OtGlyph>>;
}

export interface OtGlyphNamer {
    nameGlyph(source: OtGlyphNamingSource, gid: number, glyph: OtGlyph): string;
}
