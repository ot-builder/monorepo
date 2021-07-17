import * as ImpLib from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

export type GlyphOrder = Data.Order<OtGlyph>;
export type ListGlyphStore = ImpLib.Order.ListStore<OtGlyph>;
export type GlyphStore = Data.OrderStore<OtGlyph>;
export type GlyphStoreFactory<GS extends GlyphStore> = Data.OrderStoreFactory<OtGlyph, GS>;
export type GlyphStoreFactoryWithDefault<GS extends GlyphStore> =
    Data.OrderStoreFactoryWithDefault<OtGlyph, GS>;
export { OtListGlyphStoreFactory as ListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
