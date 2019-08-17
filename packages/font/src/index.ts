import { OtEncoding } from "@ot-builder/ft-encoding";
import { CffCoGlyphs, OtGlyphStore, TtfCoGlyphs } from "@ot-builder/ft-glyphs";
import { OtFontLayoutData } from "@ot-builder/ft-layout";
import { OtFontMetadata } from "@ot-builder/ft-metadata";
import { OtNameData } from "@ot-builder/ft-name";

export type OtFont<GS extends OtGlyphStore> = OtFont.Cff<GS> | OtFont.Ttf<GS>;
export namespace OtFont {
    // TypeDefs
    type OtFontShared = OtFontMetadata & OtEncoding & OtFontLayoutData & OtNameData;
    export type Cff<GS extends OtGlyphStore> = OtFontShared & CffCoGlyphs & { glyphs: GS };
    export type Ttf<GS extends OtGlyphStore> = OtFontShared & TtfCoGlyphs & { glyphs: GS };

    export function isCff<GS extends OtGlyphStore>(font: OtFont<GS>): font is Cff<GS> {
        return !!(font as any).cff;
    }
    export function isTtf<GS extends OtGlyphStore>(font: OtFont<GS>): font is Ttf<GS> {
        return !isCff(font);
    }
}
