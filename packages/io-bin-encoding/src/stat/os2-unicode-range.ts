import { Os2 } from "@ot-builder/ft-metadata";

import { EmptyStat, EncodingStat } from "./interface";

///////////////////////////////////////////////////////////////////////////////////////////////////

export class Os2UnicodeRangeStat extends EmptyStat {
    private mask = [0, 0, 0, 0];
    constructor(private readonly os2: Os2.Table, external?: EncodingStat) {
        super(external);
    }
    public addEncoding(u: number) {
        super.addEncoding(u);
        const fm = ensureFastMasks();
        this.mask[0] |= fm[0][u] || 0;
        this.mask[1] |= fm[1][u] || 0;
        this.mask[2] |= fm[2][u] || 0;
        this.mask[3] |= fm[3][u] || 0;
    }
    public settle() {
        super.settle();
        this.os2.ulUnicodeRange1 = this.mask[0];
        this.os2.ulUnicodeRange2 = this.mask[1];
        this.os2.ulUnicodeRange3 = this.mask[2];
        this.os2.ulUnicodeRange4 = this.mask[3];
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////

const UnicodeRanges: [number, number, number, number][] = [
    [0, 0, 0x0000, 0x007f], // Basic Latin
    [0, 1, 0x0080, 0x00ff], // Latin-1 Supplement
    [0, 2, 0x0100, 0x017f], // Latin Extended-A
    [0, 3, 0x0180, 0x024f], // Latin Extended-B
    [0, 4, 0x0250, 0x02af], // IPA Extensions
    [0, 4, 0x1d00, 0x1d7f], // Phonetic Extensions
    [0, 4, 0x1d80, 0x1dbf], // Phonetic Extensions Supplement
    [0, 5, 0x02b0, 0x02ff], // Spacing Modifier Letters
    [0, 5, 0xa700, 0xa71f], // Modifier Tone Letters
    [0, 6, 0x0300, 0x036f], // Combining Diacritical Marks
    [0, 6, 0x1dc0, 0x1dff], // Combining Diacritical Marks Supplement
    [0, 7, 0x0370, 0x03ff], // Greek and Coptic
    [0, 8, 0x2c80, 0x2cff], // Coptic
    [0, 9, 0x0400, 0x04ff], // Cyrillic
    [0, 9, 0x0500, 0x052f], // Cyrillic Supplement
    [0, 9, 0x2de0, 0x2dff], // Cyrillic Extended-A
    [0, 9, 0xa640, 0xa69f], // Cyrillic Extended-B
    [0, 10, 0x0530, 0x058f], // Armenian
    [0, 11, 0x0590, 0x05ff], // Hebrew
    [0, 12, 0xa500, 0xa63f], // Vai
    [0, 13, 0x0600, 0x06ff], // Arabic
    [0, 13, 0x0750, 0x077f], // Arabic Supplement
    [0, 14, 0x07c0, 0x07ff], // NKo
    [0, 15, 0x0900, 0x097f], // Devanagari
    [0, 16, 0x0980, 0x09ff], // Bengali
    [0, 17, 0x0a00, 0x0a7f], // Gurmukhi
    [0, 18, 0x0a80, 0x0aff], // Gujarati
    [0, 19, 0x0b00, 0x0b7f], // Oriya
    [0, 20, 0x0b80, 0x0bff], // Tamil
    [0, 21, 0x0c00, 0x0c7f], // Telugu
    [0, 22, 0x0c80, 0x0cff], // Kannada
    [0, 23, 0x0d00, 0x0d7f], // Malayalam
    [0, 24, 0x0e00, 0x0e7f], // Thai
    [0, 25, 0x0e80, 0x0eff], // Lao
    [0, 26, 0x10a0, 0x10ff], // Georgian
    [0, 26, 0x2d00, 0x2d2f], // Georgian Supplement
    [0, 27, 0x1b00, 0x1b7f], // Balinese
    [0, 28, 0x1100, 0x11ff], // Hangul Jamo
    [0, 29, 0x1e00, 0x1eff], // Latin Extended Additional
    [0, 29, 0x2c60, 0x2c7f], // Latin Extended-C
    [0, 29, 0xa720, 0xa7ff], // Latin Extended-D
    [0, 30, 0x1f00, 0x1fff], // Greek Extended
    [0, 31, 0x2000, 0x206f], // General Punctuation
    [0, 31, 0x2e00, 0x2e7f], // Supplemental Punctuation
    [1, 0, 0x2070, 0x209f], // Superscripts And Subscripts
    [1, 1, 0x20a0, 0x20cf], // Currency Symbols
    [1, 2, 0x20d0, 0x20ff], // Combining Diacritical Marks For Symbols
    [1, 3, 0x2100, 0x214f], // Letterlike Symbols
    [1, 4, 0x2150, 0x218f], // Number Forms
    [1, 5, 0x2190, 0x21ff], // Arrows
    [1, 5, 0x27f0, 0x27ff], // Supplemental Arrows-A
    [1, 5, 0x2900, 0x297f], // Supplemental Arrows-B
    [1, 5, 0x2b00, 0x2bff], // Miscellaneous Symbols and Arrows
    [1, 6, 0x2200, 0x22ff], // Mathematical Operators
    [1, 6, 0x2a00, 0x2aff], // Supplemental Mathematical Operators
    [1, 6, 0x27c0, 0x27ef], // Miscellaneous Mathematical Symbols-A
    [1, 6, 0x2980, 0x29ff], // Miscellaneous Mathematical Symbols-B
    [1, 7, 0x2300, 0x23ff], // Miscellaneous Technical
    [1, 8, 0x2400, 0x243f], // Control Pictures
    [1, 9, 0x2440, 0x245f], // Optical Character Recognition
    [1, 10, 0x2460, 0x24ff], // Enclosed Alphanumerics
    [1, 11, 0x2500, 0x257f], // Box Drawing
    [1, 12, 0x2580, 0x259f], // Block Elements
    [1, 13, 0x25a0, 0x25ff], // Geometric Shapes
    [1, 14, 0x2600, 0x26ff], // Miscellaneous Symbols
    [1, 15, 0x2700, 0x27bf], // Dingbats
    [1, 16, 0x3000, 0x303f], // CJK Symbols And Punctuation
    [1, 17, 0x3040, 0x309f], // Hiragana
    [1, 18, 0x30a0, 0x30ff], // Katakana
    [1, 18, 0x31f0, 0x31ff], // Katakana Phonetic Extensions
    [1, 19, 0x3100, 0x312f], // Bopomofo
    [1, 19, 0x31a0, 0x31bf], // Bopomofo Extended
    [1, 20, 0x3130, 0x318f], // Hangul Compatibility Jamo
    [1, 21, 0xa840, 0xa87f], // Phags-pa
    [1, 22, 0x3200, 0x32ff], // Enclosed CJK Letters And Months
    [1, 23, 0x3300, 0x33ff], // CJK Compatibility
    [1, 24, 0xac00, 0xd7af], // Hangul Syllables
    [1, 25, 0xd800, 0xdfff], // Non-Plane 0 *
    [1, 26, 0x10900, 0x1091f], // Phoenician
    [1, 27, 0x4e00, 0x9fff], // CJK Unified Ideographs
    [1, 27, 0x2e80, 0x2eff], // CJK Radicals Supplement
    [1, 27, 0x2f00, 0x2fdf], // Kangxi Radicals
    [1, 27, 0x2ff0, 0x2fff], // Ideographic Description Characters
    [1, 27, 0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
    [1, 27, 0x20000, 0x2a6df], // CJK Unified Ideographs Extension B
    [1, 27, 0x3190, 0x319f], // Kanbun
    [1, 28, 0xe000, 0xf8ff], // Private Use Area [plane 0]
    [1, 29, 0x31c0, 0x31ef], // CJK Strokes
    [1, 29, 0xf900, 0xfaff], // CJK Compatibility Ideographs
    [1, 29, 0x2f800, 0x2fa1f], // CJK Compatibility Ideographs Supplement
    [1, 30, 0xfb00, 0xfb4f], // Alphabetic Presentation Forms
    [1, 31, 0xfb50, 0xfdff], // Arabic Presentation Forms-A
    [2, 0, 0xfe20, 0xfe2f], // Combining Half Marks
    [2, 1, 0xfe10, 0xfe1f], // Vertical Forms
    [2, 1, 0xfe30, 0xfe4f], // CJK Compatibility Forms
    [2, 2, 0xfe50, 0xfe6f], // Small Form Variants
    [2, 3, 0xfe70, 0xfeff], // Arabic Presentation Forms-B
    [2, 4, 0xff00, 0xffef], // Halfwidth And Fullwidth Forms
    [2, 5, 0xfff0, 0xffff], // Specials
    [2, 6, 0x0f00, 0x0fff], // Tibetan
    [2, 7, 0x0700, 0x074f], // Syriac
    [2, 8, 0x0780, 0x07bf], // Thaana
    [2, 9, 0x0d80, 0x0dff], // Sinhala
    [2, 10, 0x1000, 0x109f], // Myanmar
    [2, 11, 0x1200, 0x137f], // Ethiopic
    [2, 11, 0x1380, 0x139f], // Ethiopic Supplement
    [2, 11, 0x2d80, 0x2ddf], // Ethiopic Extended
    [2, 12, 0x13a0, 0x13ff], // Cherokee
    [2, 13, 0x1400, 0x167f], // Unified Canadian Aboriginal Syllabics
    [2, 14, 0x1680, 0x169f], // Ogham
    [2, 15, 0x16a0, 0x16ff], // Runic
    [2, 16, 0x1780, 0x17ff], // Khmer
    [2, 16, 0x19e0, 0x19ff], // Khmer Symbols
    [2, 17, 0x1800, 0x18af], // Mongolian
    [2, 18, 0x2800, 0x28ff], // Braille Patterns
    [2, 19, 0xa000, 0xa48f], // Yi Syllables
    [2, 19, 0xa490, 0xa4cf], // Yi Radicals
    [2, 20, 0x1700, 0x171f], // Tagalog
    [2, 20, 0x1720, 0x173f], // Hanunoo
    [2, 20, 0x1740, 0x175f], // Buhid
    [2, 20, 0x1760, 0x177f], // Tagbanwa
    [2, 21, 0x10300, 0x1032f], // Old Italic
    [2, 22, 0x10330, 0x1034f], // Gothic
    [2, 23, 0x10400, 0x1044f], // Deseret
    [2, 24, 0x1d000, 0x1d0ff], // Byzantine Musical Symbols
    [2, 24, 0x1d100, 0x1d1ff], // Musical Symbols
    [2, 24, 0x1d200, 0x1d24f], // Ancient Greek Musical Notation
    [2, 25, 0x1d400, 0x1d7ff], // Mathematical Alphanumeric Symbols
    [2, 26, 0xf0000, 0xffffd], // Private Use [plane 15]
    [2, 26, 0x100000, 0x10fffd], // Private Use [plane 16]
    [2, 27, 0xfe00, 0xfe0f], // Variation Selectors
    [2, 27, 0xe0100, 0xe01ef], // Variation Selectors Supplement
    [2, 28, 0xe0000, 0xe007f], // Tags
    [2, 29, 0x1900, 0x194f], // Limbu
    [2, 30, 0x1950, 0x197f], // Tai Le
    [2, 31, 0x1980, 0x19df], // New Tai Lue
    [3, 0, 0x1a00, 0x1a1f], // Buginese
    [3, 1, 0x2c00, 0x2c5f], // Glagolitic
    [3, 2, 0x2d30, 0x2d7f], // Tifinagh
    [3, 3, 0x4dc0, 0x4dff], // Yijing Hexagram Symbols
    [3, 4, 0xa800, 0xa82f], // Syloti Nagri
    [3, 5, 0x10000, 0x1007f], // Linear B Syllabary
    [3, 5, 0x10080, 0x100ff], // Linear B Ideograms
    [3, 5, 0x10100, 0x1013f], // Aegean Numbers
    [3, 6, 0x10140, 0x1018f], // Ancient Greek Numbers
    [3, 7, 0x10380, 0x1039f], // Ugaritic
    [3, 8, 0x103a0, 0x103df], // Old Persian
    [3, 9, 0x10450, 0x1047f], // Shavian
    [3, 10, 0x10480, 0x104af], // Osmanya
    [3, 11, 0x10800, 0x1083f], // Cypriot Syllabary
    [3, 12, 0x10a00, 0x10a5f], // Kharoshthi
    [3, 13, 0x1d300, 0x1d35f], // Tai Xuan Jing Symbols
    [3, 14, 0x12000, 0x123ff], // Cuneiform
    [3, 14, 0x12400, 0x1247f], // Cuneiform Numbers and Punctuation
    [3, 15, 0x1d360, 0x1d37f], // Counting Rod Numerals
    [3, 16, 0x1b80, 0x1bbf], // Sundanese
    [3, 17, 0x1c00, 0x1c4f], // Lepcha
    [3, 18, 0x1c50, 0x1c7f], // Ol Chiki
    [3, 19, 0xa880, 0xa8df], // Saurashtra
    [3, 20, 0xa900, 0xa92f], // Kayah Li
    [3, 21, 0xa930, 0xa95f], // Rejang
    [3, 22, 0xaa00, 0xaa5f], // Cham
    [3, 23, 0x10190, 0x101cf], // Ancient Symbols
    [3, 24, 0x101d0, 0x101ff], // Phaistos Disc
    [3, 25, 0x102a0, 0x102df], // Carian
    [3, 25, 0x10280, 0x1029f], // Lycian
    [3, 25, 0x10920, 0x1093f], // Lydian
    [3, 26, 0x1f030, 0x1f09f], // Domino Tiles
    [3, 26, 0x1f000, 0x1f02f] // Mahjong Tiles
];

let FastMasks: null | number[][] = null;
function ensureFastMasks(): number[][] {
    if (FastMasks) return FastMasks;
    let masks: number[][] = [[], [], [], []];
    for (const [item, bit, start, end] of UnicodeRanges) {
        for (let u = start; u <= end; u++) {
            let a = masks[item];
            a[u] = (1 << bit) | (a[u] || 0);
        }
    }
    FastMasks = masks;
    return masks;
}
