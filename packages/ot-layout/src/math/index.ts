import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { Int16 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export const Tag = "MATH";

export class Table {
    constructor(
        public constants: Data.Maybe<Constants> = null,
        public glyphInfo: Data.Maybe<GlyphInfo> = null,
        public variants: Data.Maybe<Variants> = null
    ) {}
}
export type ValueRecord = {
    readonly value: OtVar.Value;
    readonly device?: Data.Maybe<ReadonlyArray<number>>;
};
export class Constants {
    public scriptPercentScaleDown: Int16 = 0;
    public scriptScriptPercentScaleDown: Int16 = 0;
    public delimitedSubFormulaMinHeight: OtVar.Value = 0;
    public displayOperatorMinHeight: OtVar.Value = 0;
    public mathLeading: ValueRecord = { value: 0 };
    public axisHeight: ValueRecord = { value: 0 };
    public accentBaseHeight: ValueRecord = { value: 0 };
    public flattenedAccentBaseHeight: ValueRecord = { value: 0 };
    public subscriptShiftDown: ValueRecord = { value: 0 };
    public subscriptTopMax: ValueRecord = { value: 0 };
    public subscriptBaselineDropMin: ValueRecord = { value: 0 };
    public superscriptShiftUp: ValueRecord = { value: 0 };
    public superscriptShiftUpCramped: ValueRecord = { value: 0 };
    public superscriptBottomMin: ValueRecord = { value: 0 };
    public superscriptBaselineDropMax: ValueRecord = { value: 0 };
    public subSuperscriptGapMin: ValueRecord = { value: 0 };
    public superscriptBottomMaxWithSubscript: ValueRecord = { value: 0 };
    public spaceAfterScript: ValueRecord = { value: 0 };
    public upperLimitGapMin: ValueRecord = { value: 0 };
    public upperLimitBaselineRiseMin: ValueRecord = { value: 0 };
    public lowerLimitGapMin: ValueRecord = { value: 0 };
    public lowerLimitBaselineDropMin: ValueRecord = { value: 0 };
    public stackTopShiftUp: ValueRecord = { value: 0 };
    public stackTopDisplayStyleShiftUp: ValueRecord = { value: 0 };
    public stackBottomShiftDown: ValueRecord = { value: 0 };
    public stackBottomDisplayStyleShiftDown: ValueRecord = { value: 0 };
    public stackGapMin: ValueRecord = { value: 0 };
    public stackDisplayStyleGapMin: ValueRecord = { value: 0 };
    public stretchStackTopShiftUp: ValueRecord = { value: 0 };
    public stretchStackBottomShiftDown: ValueRecord = { value: 0 };
    public stretchStackGapAboveMin: ValueRecord = { value: 0 };
    public stretchStackGapBelowMin: ValueRecord = { value: 0 };
    public fractionNumeratorShiftUp: ValueRecord = { value: 0 };
    public fractionNumeratorDisplayStyleShiftUp: ValueRecord = { value: 0 };
    public fractionDenominatorShiftDown: ValueRecord = { value: 0 };
    public fractionDenominatorDisplayStyleShiftDown: ValueRecord = { value: 0 };
    public fractionNumeratorGapMin: ValueRecord = { value: 0 };
    public fractionNumDisplayStyleGapMin: ValueRecord = { value: 0 };
    public fractionRuleThickness: ValueRecord = { value: 0 };
    public fractionDenominatorGapMin: ValueRecord = { value: 0 };
    public fractionDenomDisplayStyleGapMin: ValueRecord = { value: 0 };
    public skewedFractionHorizontalGap: ValueRecord = { value: 0 };
    public skewedFractionVerticalGap: ValueRecord = { value: 0 };
    public overbarVerticalGap: ValueRecord = { value: 0 };
    public overbarRuleThickness: ValueRecord = { value: 0 };
    public overbarExtraAscender: ValueRecord = { value: 0 };
    public underbarVerticalGap: ValueRecord = { value: 0 };
    public underbarRuleThickness: ValueRecord = { value: 0 };
    public underbarExtraDescender: ValueRecord = { value: 0 };
    public radicalVerticalGap: ValueRecord = { value: 0 };
    public radicalDisplayStyleVerticalGap: ValueRecord = { value: 0 };
    public radicalRuleThickness: ValueRecord = { value: 0 };
    public radicalExtraAscender: ValueRecord = { value: 0 };
    public radicalKernBeforeDegree: ValueRecord = { value: 0 };
    public radicalKernAfterDegree: ValueRecord = { value: 0 };
    public radicalDegreeBottomRaisePercent: Int16 = 0;
}
export class GlyphInfo {
    constructor(
        public italicCorrections: Map<OtGlyph, ValueRecord> = new Map(),
        public topAccentAttachments: Map<OtGlyph, ValueRecord> = new Map(),
        public extendedShapes: Data.Maybe<Set<OtGlyph>> = null,
        public kernInfos: Map<OtGlyph, KernInfo> = new Map()
    ) {}
}
export class KernInfo {
    constructor(
        public topRight: Data.Maybe<Kern> = null,
        public topLeft: Data.Maybe<Kern> = null,
        public bottomRight: Data.Maybe<Kern> = null,
        public bottomLeft: Data.Maybe<Kern> = null
    ) {}
}
export class Kern {
    constructor(
        public kernValue: ValueRecord = { value: 0 },
        public corrections: [ValueRecord, ValueRecord][] = []
    ) {}
}
export class GlyphVariantRecord {
    constructor(
        public readonly variantGlyph: OtGlyph,
        public readonly advanceMeasurement: OtVar.Value
    ) {}
}
export enum GlyphPartFlags {
    None = 0,
    Extender = 0x0001
}
export class GlyphPart {
    constructor(
        public readonly partGlyph: OtGlyph,
        public readonly startConnectorLength: OtVar.Value,
        public readonly endConnectorLength: OtVar.Value,
        public readonly fullAdvance: OtVar.Value,
        public readonly flags: GlyphPartFlags
    ) {}
}
export class GlyphAssembly {
    constructor(
        public italicCorrection: ValueRecord,
        public parts: GlyphPart[]
    ) {}
}
export class GlyphConstruction {
    constructor(
        public assembly: Data.Maybe<GlyphAssembly> = null,
        public variants: GlyphVariantRecord[] = []
    ) {}
}
export class Variants {
    constructor(
        public minConnectorOverlap: OtVar.Value = 0,
        public vertical: Data.Maybe<Map<OtGlyph, GlyphConstruction>> = new Map(),
        public horizontal: Data.Maybe<Map<OtGlyph, GlyphConstruction>> = new Map()
    ) {}
}
