import { RectifyImpl } from "@ot-builder/common-impl";
import { Data } from "@ot-builder/prelude";
import { OtVar } from "@ot-builder/variance";

import { OtGlyph } from "../ot-glyph";

export namespace Cff {
    export const Tag1 = "CFF ";
    export const Tag2 = "CFF2";

    export class PrivateDict implements OtVar.Rectifiable {
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

        public rectifyCoords(rec: OtVar.Rectifier) {
            this.blueValues = RectifyImpl.Coord.list(rec, this.blueValues);
            this.otherBlues = RectifyImpl.Coord.list(rec, this.otherBlues);
            this.familyBlues = RectifyImpl.Coord.list(rec, this.familyBlues);
            this.familyOtherBlues = RectifyImpl.Coord.list(rec, this.familyOtherBlues);
            this.stemSnapH = RectifyImpl.Coord.list(rec, this.stemSnapH);
            this.stemSnapV = RectifyImpl.Coord.list(rec, this.stemSnapV);
            this.blueScale = rec.coord(this.blueScale);
            this.blueShift = rec.coord(this.blueShift);
            this.blueFuzz = rec.coord(this.blueFuzz);
            this.stdHW = rec.coord(this.stdHW);
            this.stdVW = rec.coord(this.stdVW);
            this.expansionFactor = rec.coord(this.expansionFactor);
        }
    }

    export class CID implements OtGlyph.Rectifiable {
        // ROS
        public registry: string = "Adobe";
        public ordering: string = "Identity";
        public supplement: number = 0;
        // Optional, only present in subset fonts
        public mapping: null | Map<number, OtGlyph> = null;

        public rectifyGlyphs(rec: OtGlyph.Rectifier) {
            if (this.mapping) this.mapping = RectifyImpl.Glyph.comapSome(rec, this.mapping);
        }
    }

    export class FontDict implements OtVar.Rectifiable {
        public version: string | null = null;
        public notice: string | null = null;
        public copyright: string | null = null;
        public fullName: string | null = null;
        public familyName: string | null = null;
        public weight: string | null = null;
        public isFixedPitch: boolean = false;
        public italicAngle: number = 0;
        public underlinePosition: number = -100;
        public underlineThickness: number = 50;
        public paintType: number = 0;
        public readonly charStringType: number = 2;
        public strokeWidth: number = 0;

        public privateDict: PrivateDict | null = null;
        public fontMatrix: OtGlyph.Transform2X3 | null = null;

        // CID
        public cidFontName: string | null = null;
        public cidFontVersion: number = 0;
        public cidFontRevision: number = 0;
        public cidFontType: number = 0;
        public cidCount: number = 8720;

        public rectifyCoords(rec: OtVar.Rectifier) {
            if (this.privateDict) this.privateDict.rectifyCoords(rec);
        }
    }

    // CFF(2) table
    export class Table implements OtVar.Rectifiable, OtGlyph.Rectifiable {
        constructor(public readonly version: number) {}
        public postScriptFontName: string = "";
        public cid: CID | null = null;
        public fontDict: FontDict = new FontDict();
        public fdArray: FontDict[] | null = null;
        public fdSelect: null | Map<OtGlyph, number> = null;

        public rectifyGlyphs(rec: OtGlyph.Rectifier) {
            if (this.cid) this.cid.rectifyGlyphs(rec);
            if (this.fdSelect) this.fdSelect = RectifyImpl.Glyph.mapSome(rec, this.fdSelect);
        }
        public rectifyCoords(rec: OtVar.Rectifier) {
            this.fontDict.rectifyCoords(rec);
            if (this.fdArray) for (const fd of this.fdArray) fd.rectifyCoords(rec);
        }
    }
}

export interface CffCoGlyphs {
    cff: Cff.Table;
    cffGlyphNaming?: Data.Maybe<Data.Naming.Source<OtGlyph>>;
}
