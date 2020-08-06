import * as Ot from "@ot-builder/ot";

import { CoordRectifier, GlyphReferenceRectifier } from "../../interface";
import { RectifyImpl } from "../../shared";

export function rectifyMathTable(
    rg: GlyphReferenceRectifier,
    rc: CoordRectifier,
    mt: Ot.Math.Table
) {
    return new Ot.Math.Table(
        RectifyImpl.maybeT(rc, mt.constants, rectifyMathConstants),
        RectifyImpl.maybe2T(rg, rc, mt.glyphInfo, rectifyGlyphInfo),
        RectifyImpl.maybe2T(rg, rc, mt.variants, rectifyVariants)
    );
}

function rectifyMathConstants(rc: CoordRectifier, mc: Ot.Math.Constants) {
    const mc1 = new Ot.Math.Constants();
    mc1.scriptPercentScaleDown = mc.scriptPercentScaleDown;
    mc1.scriptScriptPercentScaleDown = mc.scriptScriptPercentScaleDown;
    mc1.delimitedSubFormulaMinHeight = mc.delimitedSubFormulaMinHeight;
    mc1.displayOperatorMinHeight = mc.displayOperatorMinHeight;
    mc1.mathLeading = rectifyValueRecord(rc, mc.mathLeading);
    mc1.axisHeight = rectifyValueRecord(rc, mc.axisHeight);
    mc1.accentBaseHeight = rectifyValueRecord(rc, mc.accentBaseHeight);
    mc1.flattenedAccentBaseHeight = rectifyValueRecord(rc, mc.flattenedAccentBaseHeight);
    mc1.subscriptShiftDown = rectifyValueRecord(rc, mc.subscriptShiftDown);
    mc1.subscriptTopMax = rectifyValueRecord(rc, mc.subscriptTopMax);
    mc1.subscriptBaselineDropMin = rectifyValueRecord(rc, mc.subscriptBaselineDropMin);
    mc1.superscriptShiftUp = rectifyValueRecord(rc, mc.superscriptShiftUp);
    mc1.superscriptShiftUpCramped = rectifyValueRecord(rc, mc.superscriptShiftUpCramped);
    mc1.superscriptBottomMin = rectifyValueRecord(rc, mc.superscriptBottomMin);
    mc1.superscriptBaselineDropMax = rectifyValueRecord(rc, mc.superscriptBaselineDropMax);
    mc1.subSuperscriptGapMin = rectifyValueRecord(rc, mc.subSuperscriptGapMin);
    mc1.superscriptBottomMaxWithSubscript = rectifyValueRecord(
        rc,
        mc.superscriptBottomMaxWithSubscript
    );
    mc1.spaceAfterScript = rectifyValueRecord(rc, mc.spaceAfterScript);
    mc1.upperLimitGapMin = rectifyValueRecord(rc, mc.upperLimitGapMin);
    mc1.upperLimitBaselineRiseMin = rectifyValueRecord(rc, mc.upperLimitBaselineRiseMin);
    mc1.lowerLimitGapMin = rectifyValueRecord(rc, mc.lowerLimitGapMin);
    mc1.lowerLimitBaselineDropMin = rectifyValueRecord(rc, mc.lowerLimitBaselineDropMin);
    mc1.stackTopShiftUp = rectifyValueRecord(rc, mc.stackTopShiftUp);
    mc1.stackTopDisplayStyleShiftUp = rectifyValueRecord(rc, mc.stackTopDisplayStyleShiftUp);
    mc1.stackBottomShiftDown = rectifyValueRecord(rc, mc.stackBottomShiftDown);
    mc1.stackBottomDisplayStyleShiftDown = rectifyValueRecord(
        rc,
        mc.stackBottomDisplayStyleShiftDown
    );
    mc1.stackGapMin = rectifyValueRecord(rc, mc.stackGapMin);
    mc1.stackDisplayStyleGapMin = rectifyValueRecord(rc, mc.stackDisplayStyleGapMin);
    mc1.stretchStackTopShiftUp = rectifyValueRecord(rc, mc.stretchStackTopShiftUp);
    mc1.stretchStackBottomShiftDown = rectifyValueRecord(rc, mc.stretchStackBottomShiftDown);
    mc1.stretchStackGapAboveMin = rectifyValueRecord(rc, mc.stretchStackGapAboveMin);
    mc1.stretchStackGapBelowMin = rectifyValueRecord(rc, mc.stretchStackGapBelowMin);
    mc1.fractionNumeratorShiftUp = rectifyValueRecord(rc, mc.fractionNumeratorShiftUp);
    mc1.fractionNumeratorDisplayStyleShiftUp = rectifyValueRecord(
        rc,
        mc.fractionNumeratorDisplayStyleShiftUp
    );
    mc1.fractionDenominatorShiftDown = rectifyValueRecord(rc, mc.fractionDenominatorShiftDown);
    mc1.fractionDenominatorDisplayStyleShiftDown = rectifyValueRecord(
        rc,
        mc.fractionDenominatorDisplayStyleShiftDown
    );
    mc1.fractionNumeratorGapMin = rectifyValueRecord(rc, mc.fractionNumeratorGapMin);
    mc1.fractionNumDisplayStyleGapMin = rectifyValueRecord(rc, mc.fractionNumDisplayStyleGapMin);
    mc1.fractionRuleThickness = rectifyValueRecord(rc, mc.fractionRuleThickness);
    mc1.fractionDenominatorGapMin = rectifyValueRecord(rc, mc.fractionDenominatorGapMin);
    mc1.fractionDenomDisplayStyleGapMin = rectifyValueRecord(
        rc,
        mc.fractionDenomDisplayStyleGapMin
    );
    mc1.skewedFractionHorizontalGap = rectifyValueRecord(rc, mc.skewedFractionHorizontalGap);
    mc1.skewedFractionVerticalGap = rectifyValueRecord(rc, mc.skewedFractionVerticalGap);
    mc1.overbarVerticalGap = rectifyValueRecord(rc, mc.overbarVerticalGap);
    mc1.overbarRuleThickness = rectifyValueRecord(rc, mc.overbarRuleThickness);
    mc1.overbarExtraAscender = rectifyValueRecord(rc, mc.overbarExtraAscender);
    mc1.underbarVerticalGap = rectifyValueRecord(rc, mc.underbarVerticalGap);
    mc1.underbarRuleThickness = rectifyValueRecord(rc, mc.underbarRuleThickness);
    mc1.underbarExtraDescender = rectifyValueRecord(rc, mc.underbarExtraDescender);
    mc1.radicalVerticalGap = rectifyValueRecord(rc, mc.radicalVerticalGap);
    mc1.radicalDisplayStyleVerticalGap = rectifyValueRecord(rc, mc.radicalDisplayStyleVerticalGap);
    mc1.radicalRuleThickness = rectifyValueRecord(rc, mc.radicalRuleThickness);
    mc1.radicalExtraAscender = rectifyValueRecord(rc, mc.radicalExtraAscender);
    mc1.radicalKernBeforeDegree = rectifyValueRecord(rc, mc.radicalKernBeforeDegree);
    mc1.radicalKernAfterDegree = rectifyValueRecord(rc, mc.radicalKernAfterDegree);
    mc1.radicalDegreeBottomRaisePercent = mc.radicalDegreeBottomRaisePercent;
    return mc1;
}
function rectifyGlyphInfo(rg: GlyphReferenceRectifier, rc: CoordRectifier, gi: Ot.Math.GlyphInfo) {
    return new Ot.Math.GlyphInfo(
        RectifyImpl.Glyph.mapSomeTY(rg, rc, gi.italicCorrections, rectifyValueRecord),
        RectifyImpl.Glyph.mapSomeTY(rg, rc, gi.topAccentAttachments, rectifyValueRecord),
        RectifyImpl.Glyph.setSomeN(rg, gi.extendedShapes),
        RectifyImpl.Glyph.mapSomeTY(rg, rc, gi.kernInfos, rectifyKernInfo)
    );
}
function rectifyKernInfo(rc: CoordRectifier, mk: Ot.Math.KernInfo) {
    return new Ot.Math.KernInfo(
        RectifyImpl.maybeT(rc, mk.topRight, rectifyKern),
        RectifyImpl.maybeT(rc, mk.topLeft, rectifyKern),
        RectifyImpl.maybeT(rc, mk.bottomRight, rectifyKern),
        RectifyImpl.maybeT(rc, mk.bottomLeft, rectifyKern)
    );
}
function rectifyKern(rc: CoordRectifier, mk: Ot.Math.Kern) {
    return new Ot.Math.Kern(
        rectifyValueRecord(rc, mk.kernValue),
        RectifyImpl.listSomeT(rc, mk.corrections, rectifyValueRecordPair)
    );
}
function rectifyVariants(rg: GlyphReferenceRectifier, rc: CoordRectifier, mv: Ot.Math.Variants) {
    return new Ot.Math.Variants(
        rc.coord(mv.minConnectorOverlap),
        mv.vertical
            ? RectifyImpl.Glyph.mapSomeTY2(rg, rc, mv.vertical, rectifyGlyphConstruction)
            : null,
        mv.horizontal
            ? RectifyImpl.Glyph.mapSomeTY2(rg, rc, mv.horizontal, rectifyGlyphConstruction)
            : null
    );
}
function rectifyGlyphConstruction(
    rg: GlyphReferenceRectifier,
    rc: CoordRectifier,
    gc: Ot.Math.GlyphConstruction
) {
    return new Ot.Math.GlyphConstruction(
        RectifyImpl.maybe2T(rg, rc, gc.assembly, rectifyGlyphAssembly),
        RectifyImpl.listSome2T(rg, rc, gc.variants, rectifyGlyphVariantRecord)
    );
}
function rectifyGlyphAssembly(
    rg: GlyphReferenceRectifier,
    rc: CoordRectifier,
    ga: Ot.Math.GlyphAssembly
) {
    if (!ga) return null;
    const gps = RectifyImpl.listAll2T(rg, rc, ga.parts, rectifyGlyphPart);
    if (!gps) return null;
    return new Ot.Math.GlyphAssembly(rectifyValueRecord(rc, ga.italicCorrection), gps);
}
function rectifyGlyphPart(rg: GlyphReferenceRectifier, rc: CoordRectifier, gp: Ot.Math.GlyphPart) {
    const g1 = rg.glyphRef(gp.partGlyph);
    if (!g1) return null;
    else
        return new Ot.Math.GlyphPart(
            g1,
            rc.coord(gp.startConnectorLength),
            rc.coord(gp.endConnectorLength),
            rc.coord(gp.fullAdvance),
            gp.flags
        );
}

function rectifyGlyphVariantRecord(
    rg: GlyphReferenceRectifier,
    rc: CoordRectifier,
    ga: Ot.Math.GlyphVariantRecord
) {
    const g1 = rg.glyphRef(ga.variantGlyph);
    if (!g1) return null;
    else return new Ot.Math.GlyphVariantRecord(g1, rc.coord(ga.advanceMeasurement));
}

function rectifyValueRecord(rc: CoordRectifier, v: Ot.Math.ValueRecord): Ot.Math.ValueRecord {
    return { ...v, value: rc.coord(v.value) };
}
function rectifyValueRecordPair(
    rc: CoordRectifier,
    [a, b]: [Ot.Math.ValueRecord, Ot.Math.ValueRecord]
): [Ot.Math.ValueRecord, Ot.Math.ValueRecord] {
    return [rectifyValueRecord(rc, a), rectifyValueRecord(rc, b)];
}
