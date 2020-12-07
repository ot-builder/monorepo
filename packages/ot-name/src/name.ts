import { Data } from "@ot-builder/prelude";

export namespace Name {
    export const Tag = "name";
    export type Record = {
        readonly platformID: number;
        readonly encodingID: number;
        readonly languageID: number;
        readonly nameID: number;
        readonly value: string | Buffer;
    };
    export class Table {
        public records: Record[] = [];
        public langTagMap: Data.Maybe<string[]> = null;
    }
    export enum NameID {
        Copyright = 0,
        LegacyFamily = 1,
        LegacySubfamily = 2,
        UniqueFontId = 3,
        FullFontName = 4,
        VersionString = 5,
        PostscriptName = 6,
        Trademark = 7,
        Manufacturer = 8,
        Designer = 9,
        Description = 10,
        UrlVendor = 11,
        UrlDesigner = 12,
        LicenseDescription = 13,
        LicenseInfoUrl = 14,
        PreferredFamily = 16,
        PreferredSubfamily = 17,
        CompatibleFull = 18,
        SampleText = 19,
        PostscriptCidFindfont = 20,
        WwsFamily = 21,
        WwsSubfamily = 22,
        LightBackgroundPalette = 23,
        DarkBackgroundPalette = 24,
        VariationsPostScriptNamePrefix = 25
    }
}
