import { F16D16, Int16, UInt16, UInt32 } from "@ot-builder/primitive";

export namespace Head {
    export const Tag = "head";

    export enum Flags {
        BaseLineYAt0 = 1 << 0,
        LeftSidebearingAtX0 = 1 << 1,
        InstructionsMayDependOnPointSize = 1 << 2,
        ForcePpemToBeInteger = 1 << 3,
        InstructionMayAlterAdvanceWidth = 1 << 4,
        IntendedToBeVertical = 1 << 5,
        Reserved6 = 1 << 6,
        NeedComplexLayout = 1 << 7,
        HasAATMetamorphism = 1 << 8,
        HasStrongRightToLeft = 1 << 9,
        HasIndicRearrangement = 1 << 10,
        Compressed = 1 << 11,
        Converted = 1 << 12,
        OptimizedForClearType = 1 << 13,
        LastResortFont = 1 << 14,
        Reserved15 = 1 << 15
    }

    export enum MacStyle {
        Bold = 1 << 0,
        Italic = 1 << 1,
        Underline = 1 << 2,
        Outline = 1 << 3,
        Shadow = 1 << 4,
        Condensed = 1 << 5,
        Extended = 1 << 6
    }

    export enum FontDirectionHint {
        FullyMixed = 0,
        OnlyStrongLTR = 1,
        StrongLTROrNeutral = 2,
        OnlyStrongRTL = -1,
        StrongRTLOrNeutral = -2
    }

    export class Table {
        public majorVersion: UInt16 = 0x1;
        public minorVersion: UInt16 = 0;
        public fontRevision: F16D16 = 0;
        public readonly checkSumAdjust: UInt32 = 0;
        public readonly magicNumber: UInt32 = 0x5f0f3cf5;
        public flags: Flags = 0;
        public unitsPerEm: UInt16 = 1000;
        public created: Date = new Date();
        public modified: Date = new Date();
        public xMin: Int16 = 0; // VOLATILE
        public yMin: Int16 = 0; // VOLATILE
        public xMax: Int16 = 0; // VOLATILE
        public yMax: Int16 = 0; // VOLATILE
        public macStyle: MacStyle = 0;
        public lowestRecPPEM: UInt16 = 0;
        public fontDirectionHint: FontDirectionHint = 2;
        public indexToLocFormat: Int16 = 0; // VOLATILE
        public glyphDataFormat: Int16 = 0;
    }
}
