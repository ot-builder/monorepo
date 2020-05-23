import { Int16, Tag, UInt16, UInt8 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export namespace Os2 {
    export const Tag = "OS/2";

    export enum FsType {
        InstallableEmbedding = 1 << 0,
        RestrictedLicense = 1 << 1,
        PreviewPrintLicense = 1 << 2,
        EditableEmbedding = 1 << 3,
        Reserved4 = 1 << 4,
        Reserved5 = 1 << 5,
        Reserved6 = 1 << 6,
        Reserved7 = 1 << 7,
        NoSubsetting = 1 << 8,
        BitmapEmbeddingOnly = 1 << 9
    }

    export enum FsSelection {
        ITALIC = 1 << 0,
        UNDERSCORE = 1 << 1,
        NEGATIVE = 1 << 2,
        OUTLINED = 1 << 3,
        STRIKEOUT = 1 << 4,
        BOLD = 1 << 5,
        REGULAR = 1 << 6,
        USE_TYPO_METRICS = 1 << 7,
        WWS = 1 << 8,
        OBLIQUE = 1 << 9
    }

    export enum CodePageRange1 {
        CP1252 = 1 << 0,
        CP1250 = 1 << 1,
        CP1251 = 1 << 2,
        CP1253 = 1 << 3,
        CP1254 = 1 << 4,
        CP1255 = 1 << 5,
        CP1256 = 1 << 6,
        CP1257 = 1 << 7,
        CP1258 = 1 << 8,
        Ansi1 = 1 << 9,
        Ansi2 = 1 << 10,
        Ansi3 = 1 << 11,
        Ansi4 = 1 << 12,
        Ansi5 = 1 << 13,
        Ansi6 = 1 << 14,
        Ansi7 = 1 << 15,
        CP874 = 1 << 16,
        CP932 = 1 << 17,
        CP936 = 1 << 18,
        CP949 = 1 << 19,
        CP950 = 1 << 20,
        CP1361 = 1 << 21,
        Oem1 = 1 << 22,
        Oem2 = 1 << 23,
        Oem3 = 1 << 24,
        Oem4 = 1 << 25,
        Oem5 = 1 << 26,
        Oem6 = 1 << 27,
        Oem7 = 1 << 28,
        MacRoman = 1 << 29,
        Oem = 1 << 30,
        Symbol = 1 << 31
    }
    export enum CodePageRange2 {
        Oem8 = 1 << 0,
        Oem9 = 1 << 1,
        Oem10 = 1 << 2,
        Oem11 = 1 << 3,
        Oem12 = 1 << 4,
        Oem13 = 1 << 5,
        Oem14 = 1 << 6,
        Oem15 = 1 << 7,
        Oem16 = 1 << 8,
        Oem17 = 1 << 9,
        Oem18 = 1 << 10,
        Oem19 = 1 << 11,
        Oem20 = 1 << 12,
        Oem21 = 1 << 13,
        Oem22 = 1 << 14,
        Oem23 = 1 << 15,
        CP869 = 1 << 16,
        CP866 = 1 << 17,
        CP865 = 1 << 18,
        CP864 = 1 << 19,
        CP863 = 1 << 20,
        CP862 = 1 << 21,
        CP861 = 1 << 22,
        CP860 = 1 << 23,
        CP857 = 1 << 24,
        CP855 = 1 << 25,
        CP852 = 1 << 26,
        CP775 = 1 << 27,
        CP737 = 1 << 28,
        CP708 = 1 << 29,
        CP850 = 1 << 30,
        CP437 = 1 << 31
    }

    export enum UnicodeRange1 {
        BasicLatin = 1 << 0,
        Latin1Supplement = 1 << 1,
        LatinExtendedA = 1 << 2,
        LatinExtendedB = 1 << 3,
        Phonetics = 1 << 4,
        SpacingModifiers = 1 << 5,
        CombiningDiacriticalMarks = 1 << 6,
        GreekAndCoptic = 1 << 7,
        Coptic = 1 << 8,
        Cyrillic = 1 << 9,
        Armenian = 1 << 10,
        Hebrew = 1 << 11,
        Vai = 1 << 12,
        Arabic = 1 << 13,
        NKo = 1 << 14,
        Devanagari = 1 << 15,
        Bengali = 1 << 16,
        Gurmukhi = 1 << 17,
        Gujarati = 1 << 18,
        Oriya = 1 << 19,
        Tamil = 1 << 20,
        Telugu = 1 << 21,
        Kannada = 1 << 22,
        Malayalam = 1 << 23,
        Thai = 1 << 24,
        Lao = 1 << 25,
        Georgian = 1 << 26,
        Balinese = 1 << 27,
        HangulJamo = 1 << 28,
        LatinExtendedAdditional = 1 << 29,
        GreekExtended = 1 << 30,
        Punctuations = 1 << 31
    }

    export enum UnicodeRange2 {
        SuperscriptsAndSubscripts = 1 << 0,
        CurrencySymbols = 1 << 1,
        CombiningDiacriticalMarksForSymbols = 1 << 2,
        LetterLikeSymbols = 1 << 3,
        NumberForms = 1 << 4,
        Arrows = 1 << 5,
        MathematicalOperators = 1 << 6,
        MiscellaneousTechnical = 1 << 7,
        ControlPictures = 1 << 8,
        OpticalCharacterRecognition = 1 << 9,
        EnclosedAlphanumerics = 1 << 10,
        BoxDrawing = 1 << 11,
        BlockElements = 1 << 12,
        GeometricShapes = 1 << 13,
        MiscellaneousSymbols = 1 << 14,
        Dingbats = 1 << 15,
        CJKSymbolsAndPunctuation = 1 << 16,
        Hiragana = 1 << 17,
        Katakana = 1 << 18,
        Bopomofo = 1 << 19,
        HangulCompatibilityJamo = 1 << 20,
        Phagspa = 1 << 21,
        EnclosedCJKLettersAndMonths = 1 << 22,
        CJKCompatibility = 1 << 23,
        HangulSyllables = 1 << 24,
        NonPlane0 = 1 << 25,
        Phoenician = 1 << 26,
        CJKUnifiedIdeographs = 1 << 27,
        PrivateUseAreaP0 = 1 << 28,
        CJKStrokes = 1 << 29,
        AlphabeticPresentationForms = 1 << 30,
        ArabicPresentationFormsA = 1 << 31
    }
    export enum UnicodeRange3 {
        CombiningHalfMarks = 1 << 0,
        VerticalFormsAndCJKCompatibilityForms = 1 << 1,
        SmallFormVariants = 1 << 2,
        ArabicPresentationFormsB = 1 << 3,
        HalfWidthAndFullWidthForms = 1 << 4,
        Specials = 1 << 5,
        Tibetan = 1 << 6,
        Syriac = 1 << 7,
        Thaana = 1 << 8,
        Sinhala = 1 << 9,
        Myanmar = 1 << 10,
        Ethiopic = 1 << 11,
        Cherokee = 1 << 12,
        UnifiedCanadianAboriginalSyllabics = 1 << 13,
        Ogham = 1 << 14,
        Runic = 1 << 15,
        Khmer = 1 << 16,
        Mongolian = 1 << 17,
        BraillePatterns = 1 << 18,
        YiSyllables = 1 << 19,
        Tagalog = 1 << 20,
        OldItalic = 1 << 21,
        Gothic = 1 << 22,
        Deseret = 1 << 23,
        MusicalSymbols = 1 << 24,
        MathematicalAlphanumericSymbols = 1 << 25,
        PrivateUseP15AndP16 = 1 << 26,
        VariationSelectors = 1 << 27,
        Tags = 1 << 28,
        Limbu = 1 << 29,
        TaiLe = 1 << 30,
        NewTaiLue = 1 << 31
    }
    export enum UnicodeRange4 {
        Buginese = 1 << 0,
        Glagolitic = 1 << 1,
        Tifinagh = 1 << 2,
        YijingHexagramSymbols = 1 << 3,
        SylotiNagri = 1 << 4,
        LinearBSyllabaryIdeogramsAndAegeanNumbers = 1 << 5,
        AncientGreekNumbers = 1 << 6,
        Ugaritic = 1 << 7,
        OldPersian = 1 << 8,
        Shavian = 1 << 9,
        Osmanya = 1 << 10,
        CypriotSyllabary = 1 << 11,
        Kharoshthi = 1 << 12,
        TaiXuanJingSymbols = 1 << 13,
        Cuneiform = 1 << 14,
        CountingRodNumerals = 1 << 15,
        Sundanese = 1 << 16,
        Lepcha = 1 << 17,
        OlChiki = 1 << 18,
        Saurashtra = 1 << 19,
        KayahLi = 1 << 20,
        Rejang = 1 << 21,
        Cham = 1 << 22,
        AncientSymbols = 1 << 23,
        PhaistosDisc = 1 << 24,
        CarianAndLycian = 1 << 25,
        DominoAndMahjongTiles = 1 << 26
    }

    export class Panose {
        public bFamilyType: UInt8 = 0;
        public bSerifStyle: UInt8 = 0;
        public bWeight: UInt8 = 0;
        public bProportion: UInt8 = 0;
        public bContrast: UInt8 = 0;
        public bStrokeVariation: UInt8 = 0;
        public bArmStyle: UInt8 = 0;
        public bLetterform: UInt8 = 0;
        public bMidline: UInt8 = 0;
        public bXHeight: UInt8 = 0;
    }

    export class Table {
        constructor(public readonly version: UInt16) {}
        public xAvgCharWidth: Int16 = 0;
        public usWeightClass: UInt16 = 0;
        public usWidthClass: UInt16 = 0;
        public fsType: FsType = 0;
        public ySubscriptXSize: OtVar.Value = 0;
        public ySubscriptYSize: OtVar.Value = 0;
        public ySubscriptXOffset: OtVar.Value = 0;
        public ySubscriptYOffset: OtVar.Value = 0;
        public ySuperscriptXSize: OtVar.Value = 0;
        public ySuperscriptYSize: OtVar.Value = 0;
        public ySuperscriptXOffset: OtVar.Value = 0;
        public ySuperscriptYOffset: OtVar.Value = 0;
        public yStrikeoutSize: OtVar.Value = 0;
        public yStrikeoutPosition: OtVar.Value = 0;
        public sFamilyClass: Int16 = 0;
        public panose: Panose = new Panose();
        public ulUnicodeRange1: UnicodeRange1 = 0;
        public ulUnicodeRange2: UnicodeRange2 = 0;
        public ulUnicodeRange3: UnicodeRange3 = 0;
        public ulUnicodeRange4: UnicodeRange4 = 0;
        public achVendID: Tag = "UKWN";
        public fsSelection: FsSelection = 0;
        public usFirstCharIndex: UInt16 = 0;
        public usLastCharIndex: UInt16 = 0;
        public sTypoAscender: OtVar.Value = 0;
        public sTypoDescender: OtVar.Value = 0;
        public sTypoLineGap: OtVar.Value = 0;
        public usWinAscent: OtVar.Value = 0;
        public usWinDescent: OtVar.Value = 0;
        public ulCodePageRange1: CodePageRange1 = 0;
        public ulCodePageRange2: CodePageRange2 = 0;
        public sxHeight: OtVar.Value = 0;
        public sCapHeight: OtVar.Value = 0;
        public usDefaultChar: UInt16 = 0;
        public usBreakChar: UInt16 = 0;
        public usMaxContext: UInt16 = 0;
        public usLowerOpticalPointSize: UInt16 = 0;
        public usUpperOpticalPointSize: UInt16 = 0;
    }
}
