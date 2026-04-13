import type { OtEncoding } from "@ot-builder/ot-encoding";
import type { OtExtPrivate } from "@ot-builder/ot-ext-private";
import type { CffCoGlyphs, OtGlyph, TtfCoGlyphs } from "@ot-builder/ot-glyphs";
import type { OtFontLayoutData } from "@ot-builder/ot-layout";
import type { OtFontMetadata } from "@ot-builder/ot-metadata";
import type { OtNameData } from "@ot-builder/ot-name";
import type { OtVttPrivate } from "@ot-builder/ot-vtt-private";
import type { Data } from "@ot-builder/prelude";

export type Font<GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>> =
    | Font.Cff<GS>
    | Font.Ttf<GS>;
export namespace Font {
    // TypeDefs
    type OtFontShared = OtFontMetadata &
        OtEncoding &
        OtFontLayoutData &
        OtNameData &
        OtExtPrivate &
        OtVttPrivate;
    export type Cff<GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>> =
        OtFontShared & CffCoGlyphs & { glyphs: GS };
    export type Ttf<GS extends Data.OrderStore<OtGlyph> = Data.OrderStore<OtGlyph>> =
        OtFontShared & TtfCoGlyphs & { glyphs: GS };

    export function isCff<GS extends Data.OrderStore<OtGlyph>>(font: Font<GS>): font is Cff<GS> {
        return !!(font as any).cff;
    }
    export function isTtf<GS extends Data.OrderStore<OtGlyph>>(font: Font<GS>): font is Ttf<GS> {
        return !isCff(font);
    }
}
