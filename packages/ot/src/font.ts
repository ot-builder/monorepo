import { OtEncoding } from "@ot-builder/ot-encoding";
import { OtExtPrivate } from "@ot-builder/ot-ext-private";
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
    type OtFontShared = OtFontMetadata & OtEncoding & OtFontLayoutData & OtNameData & OtExtPrivate;
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
