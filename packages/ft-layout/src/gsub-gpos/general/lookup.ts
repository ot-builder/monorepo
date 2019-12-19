import { Data, Thunk } from "@ot-builder/prelude";

import { LayoutCommon } from "../../common";
import { DicingStore } from "../../dicing-store";

/** General lookup type */
export interface LookupPropT<G> {
    rightToLeft: boolean;
    ignoreGlyphs: Data.Maybe<Set<G>>;
}
export interface LookupT<G, X> extends LookupPropT<G> {
    acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E;
}

/** General Lookup algebra */
export interface LookupAlgT<G, X, E> {
    gsubSingle(thProps: Thunk<GsubSinglePropT<G, X>>): E;
    gsubMulti(thProps: Thunk<GsubMultipleAlternatePropT<G, X>>): E;
    gsubAlternate(thProps: Thunk<GsubMultipleAlternatePropT<G, X>>): E;
    gsubLigature(thProps: Thunk<GsubLigaturePropT<G, X>>): E;
    gsubReverse(thProps: Thunk<GsubReverseSingleSubPropT<G, X>>): E;

    gposSingle(thProps: Thunk<GposSinglePropT<G, X>>): E;
    gposPair(thProps: Thunk<GposPairPropT<G, X>>): E;
    gposCursive(thProps: Thunk<GposCursivePropT<G, X>>): E;
    gposMarkToBase(thProps: Thunk<GposMarkToBasePropT<G, X>>): E;
    gposMarkToMark(thProps: Thunk<GposMarkToMarkPropT<G, X>>): E;
    gposMarkToLigature(thProps: Thunk<GposMarkToLigaturePropT<G, X>>): E;

    // Chaining lookup has cross-references, so we need this
    crossReference?(source: object, thValue: Thunk<E>): E;
    // For chaining lookup, we are not supplying the props directly. Instead, we supply
    // its thunks so it made rectification of circular chaining lookups possible.
    gsubChaining(thProps: Thunk<ForwardChainingPropT<G, X, E>>): E;
    gposChaining(thProps: Thunk<ForwardChainingPropT<G, X, E>>): E;
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

export interface GsubReverseRuleT<G, GS> {
    match: Array<GS>;
    doSubAt: number;
    replacement: Map<G, G>;
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
export interface GposLigatureBaseRecordT<X> {
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
    bases: Map<G, GposLigatureBaseRecordT<X>>;
}

export interface ChainingApplicationT<E> {
    at: number;
    apply: E;
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
