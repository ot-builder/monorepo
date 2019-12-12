import { RectifyImpl } from "@ot-builder/common-impl";
import { Data, Rectify } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

export namespace Cff {
    export const Tag1 = "CFF ";
    export const Tag2 = "CFF2";

    export class PrivateDict {
        // CFF(2) private dict terms
        public blueValues: OtVar.Value[] = [];
        public otherBlues: OtVar.Value[] = [];
        public familyBlues: OtVar.Value[] = [];
        public familyOtherBlues: OtVar.Value[] = [];
        public stemSnapH: OtVar.Value[] = [];
        public stemSnapV: OtVar.Value[] = [];
        public blueScale: OtVar.Value = 0.039625;
        public blueShift: OtVar.Value = 7;
        public blueFuzz: OtVar.Value = 1;
        public stdHW: OtVar.Value = 0;
        public stdVW: OtVar.Value = 0;
        public languageGroup: number = 0;
        public expansionFactor: OtVar.Value = 0;
        public defaultWidthX: number = 0;
        public nominalWidthX: number = 0;

        // This filed is used only during reading CFF table
        public localSubroutines: Buffer[] | null = null;
        public inheritedVsIndex = 0;
    }

    export class CID {
        // ROS
        public registry: string = "Adobe";
        public ordering: string = "Identity";
        public supplement: number = 0;
        // Optional, only present in subset fonts
        public mapping: Data.Maybe<Map<number, OtGlyph>>;
    }

    export class FontDict {
        public version: Data.Maybe<string>;
        public notice: Data.Maybe<string>;
        public copyright: Data.Maybe<string>;
        public fullName: Data.Maybe<string>;
        public familyName: Data.Maybe<string>;
        public weight: Data.Maybe<string>;
        public isFixedPitch: boolean = false;
        public italicAngle: number = 0;
        public underlinePosition: number = -100;
        public underlineThickness: number = 50;
        public paintType: number = 0;
        public readonly charStringType: number = 2;
        public strokeWidth: number = 0;

        public privateDict: Data.Maybe<PrivateDict>;
        public fontMatrix: Data.Maybe<OtGlyph.Transform2X3>;

        // CID
        public cidFontName: Data.Maybe<string>;
        public cidFontVersion: number = 0;
        public cidFontRevision: number = 0;
        public cidFontType: number = 0;
        public cidCount: number = 8720;
    }

    // CFF(2) table
    export class Table {
        constructor(public readonly version: number) {}
        public postScriptFontName: string = "";
        public cid: Data.Maybe<CID>;
        public topDict: FontDict = new FontDict();
        public fdArray: Data.Maybe<FontDict[]>;
        public fdSelect: Data.Maybe<Map<OtGlyph, number>>;
    }
}

export interface CffCoGlyphs {
    cff: Cff.Table;
}
export interface CffCoGlyphsWithNaming extends CffCoGlyphs {
    cffGlyphNaming?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
}
