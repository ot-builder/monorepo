import { Data } from "@ot-builder/prelude";

import { OtGlyph } from "../ot-glyph";

// concrete types
export type OtGlyphStoreFactory<
    S extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>
> = Data.OrderStoreFactory<OtGlyph, S>;
export type OtGlyphStore = Data.OrderStore<OtGlyph>;
export type OtGlyphOrder = Data.Order<OtGlyph>;

// Default implementation
export const OtListGlyphStoreFactory = new Data.ListStoreFactory<OtGlyph>(
    `Glyphs`,
    () => new OtGlyph()
);
