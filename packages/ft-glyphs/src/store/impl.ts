import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";

export const OtListGlyphStoreFactory = new Data.ListStoreFactory(`Glyphs`, () => new OtGlyph());
