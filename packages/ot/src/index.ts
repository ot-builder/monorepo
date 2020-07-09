import { ImpLib } from "@ot-builder/common-impl";
import { OtEncoding } from "@ot-builder/ot-encoding";
import { CffCoGlyphs, OtGlyph, TtfCoGlyphs } from "@ot-builder/ot-glyphs";
import { OtFontLayoutData } from "@ot-builder/ot-layout";
import { OtFontMetadata } from "@ot-builder/ot-metadata";
import { OtNameData } from "@ot-builder/ot-name";
import { Data } from "@ot-builder/prelude";

export type Font<GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>> =
    | Font.Cff<GS>
    | Font.Ttf<GS>;
export namespace Font {
    // TypeDefs
    type OtFontShared = OtFontMetadata & OtEncoding & OtFontLayoutData & OtNameData;
    export type Cff<
        GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>
    > = OtFontShared & CffCoGlyphs & { glyphs: GS };
    export type Ttf<
        GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>
    > = OtFontShared & TtfCoGlyphs & { glyphs: GS };

    export function isCff<GS extends Data.OrderStore<OtGlyph>>(font: Font<GS>): font is Cff<GS> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!(font as any).cff;
    }
    export function isTtf<GS extends Data.OrderStore<OtGlyph>>(font: Font<GS>): font is Ttf<GS> {
        return !isCff(font);
    }
}

export { OtVar as Var, GeneralVar } from "@ot-builder/variance";

export { Head, Maxp, Os2, MetricHead, Fvar, Post, Avar, Gasp } from "@ot-builder/ot-metadata";

export { OtGlyph as Glyph, GeneralGlyph } from "@ot-builder/ot-glyphs";
export { Cff, Cvt, Fpgm, Prep } from "@ot-builder/ot-glyphs";
export {
    OtGlyphNamingSource as GlyphNamingSource,
    OtGlyphNamer as GlyphNamer
} from "@ot-builder/ot-glyphs";
export { OtListGlyphStoreFactory as ListGlyphStoreFactory } from "@ot-builder/ot-glyphs";
export type ListGlyphStore = ImpLib.Order.ListStore<OtGlyph>;
export type GlyphStore = Data.OrderStore<OtGlyph>;
export type GlyphStoreFactory<GS extends GlyphStore> = Data.OrderStoreFactory<OtGlyph, GS>;
export type GlyphStoreFactoryWithDefault<
    GS extends GlyphStore
> = Data.OrderStoreFactoryWithDefault<OtGlyph, GS>;
export type GlyphOrder = Data.Order<OtGlyph>;

export { Cmap, OtEncoding as Encoding, XPrv } from "@ot-builder/ot-encoding";
export { Name, Stat, Meta } from "@ot-builder/ot-name";
export {
    DicingStore,
    DicingStoreRep,
    Gdef,
    Gsub,
    Gpos,
    GsubGpos,
    Base
} from "@ot-builder/ot-layout";
export { OtStandardGlyphNamer as StandardGlyphNamer } from "@ot-builder/ot-standard-glyph-namer";

export { Sfnt } from "@ot-builder/ot-sfnt";
