import { Data } from "@ot-builder/prelude";

import { LayoutCommon } from "../common";
import { DicingStore } from "../dicing-store";

/** General lookup type */
export interface GeneralLookupT<G, X, L> extends LookupPropT<G> {
    acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E;
}

export interface LookupPropT<G> {
    rightToLeft: boolean;
    ignoreGlyphs: Data.Maybe<Set<G>>;
}
export interface LookupT<G, X> extends GeneralLookupT<G, X, LookupT<G, X>> {}

/** General Lookup algebra */
export interface LookupAlgT<G, X, E> {
    gsubSingle(lookup: GsubSinglePropT<G, X>): E;
    gsubMulti(lookup: GsubMultipleAlternatePropT<G, X>): E;
    gsubAlternate(lookup: GsubMultipleAlternatePropT<G, X>): E;
    gsubLigature(lookup: GsubLigaturePropT<G, X>): E;
    gsubReverse(lookup: GsubReverseSingleSubPropT<G, X>): E;

    gposSingle(lookup: GposSinglePropT<G, X>): E;
    gposPair(lookup: GposPairPropT<G, X>): E;
    gposCursive(lookup: GposCursivePropT<G, X>): E;
    gposMarkToBase(lookup: GposMarkToBasePropT<G, X>): E;
    gposMarkToMark(lookup: GposMarkToMarkPropT<G, X>): E;
    gposMarkToLigature(lookup: GposMarkToLigaturePropT<G, X>): E;

    gsubChaining(lookup: ForwardChainingPropT<G, X, E>): E;
    gposChaining(lookup: ForwardChainingPropT<G, X, E>): E;
}

export interface GsubSinglePropT<G, X> extends LookupPropT<G> {
    mapping: Map<G, G>;
}

export interface GsubMultipleAlternatePropT<G, X> extends LookupPropT<G> {
    mapping: Map<G, ReadonlyArray<G>>;
}

export type GsubLigatureLookupEntryT<G> = {
    readonly from: ReadonlyArray<G>;
    readonly to: G;
};
export interface GsubLigaturePropT<G, X> extends LookupPropT<G> {
    mapping: Array<GsubLigatureLookupEntryT<G>>;
}

export type GsubReverseSubstT<G> = Map<G, G>;
export interface GsubReverseRuleT<G, GS> {
    match: Array<GS>;
    doSubAt: number;
    replacement: GsubReverseSubstT<G>;
}
export interface GsubReverseSingleSubPropT<G, X> extends LookupPropT<G> {
    rules: GsubReverseRuleT<G, Set<G>>[];
}

export interface GposSinglePropT<G, X> extends LookupPropT<G> {
    adjustments: Map<G, LayoutCommon.Adjust.T<X>>;
}

export interface GposPairPropT<G, X> extends LookupPropT<G> {
    adjustments: DicingStore<G, G, LayoutCommon.Adjust.PairT<X>>;
}

export interface GposCursivePropT<G, X> extends LookupPropT<G> {
    attachments: Map<G, LayoutCommon.CursiveAnchorPair.T<X>>;
}

export interface GposMarkRecordT<X> {
    // Why array? because we may have multiple subtables defining multiple mark classes
    // and corresponded anchors for one mark glyph, used on different bases.
    markAnchors: Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>;
}
export interface GposBaseRecordT<X> {
    baseAnchors: Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>;
}
export interface GposLigatureRecordT<X> {
    baseAnchors: Array<Array<Data.Maybe<LayoutCommon.Anchor.T<X>>>>;
}
export interface GposMarkToBasePropT<G, X> extends LookupPropT<G> {
    marks: Map<G, GposMarkRecordT<X>>;
    bases: Map<G, GposBaseRecordT<X>>;
}
export interface GposMarkToMarkPropT<G, X> extends LookupPropT<G> {
    marks: Map<G, GposMarkRecordT<X>>;
    baseMarks: Map<G, GposBaseRecordT<X>>;
}
export interface GposMarkToLigaturePropT<G, X> extends LookupPropT<G> {
    marks: Map<G, GposMarkRecordT<X>>;
    bases: Map<G, GposLigatureRecordT<X>>;
}

export interface ChainingApplicationT<E> {
    at: number;
    lookup: E;
}
export interface ChainingRuleT<GS, E> {
    match: Array<GS>;
    inputBegins: number;
    inputEnds: number;
    applications: Array<ChainingApplicationT<E>>;
}
export interface ForwardChainingPropT<G, X, E> extends LookupPropT<G> {
    rules: ChainingRuleT<Set<G>, E>[];
}
