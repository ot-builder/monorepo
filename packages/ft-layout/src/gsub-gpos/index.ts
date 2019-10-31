import { RectifyImpl } from "@ot-builder/common-impl";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data, Rectify, Trace } from "@ot-builder/prelude";
import { F2D14, Tag } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import { LayoutCommon } from "../common";
import { ChainingApplicationT, ChainingRuleT, ForwardChainingLookupT } from "../lookup/chaining";
import { GeneralLookupT } from "../lookup/general";
import { GposCursiveLookupT } from "../lookup/gpos-cursive";
import {
    GposBaseRecordT,
    GposLigatureRecordT,
    GposMarkRecordT,
    GposMarkToBaseLookupT,
    GposMarkToLigatureLookupT,
    GposMarkToMarkLookupT
} from "../lookup/gpos-mark";
import { GposPairLookupT } from "../lookup/gpos-pair";
import { GposSingleLookupT } from "../lookup/gpos-single";
import { GsubLigatureLookupT } from "../lookup/gsub-ligature";
import { GsubAlternateLookupT, GsubMultipleLookupT } from "../lookup/gsub-multiple";
import { GsubReverseRuleT, GsubReverseSingleSubT, GsubReverseSubstT } from "../lookup/gsub-reverse";
import { GsubSingleLookupT } from "../lookup/gsub-single";

export namespace GsubGpos {
    export interface FeatureT<L> {
        tag: Tag;
        lookups: Array<L>;
    }
    function cleanupFeature<L>(ft: FeatureT<L>, ls: ReadonlySet<L>): null | FeatureT<L> {
        const l1 = RectifyImpl.Elim.listSomeOpt(ft.lookups, ls);
        if (!l1) return null;
        else return { ...ft, lookups: l1 };
    }

    export interface LanguageT<L> {
        requiredFeature: Data.Maybe<FeatureT<L>>;
        features: Array<FeatureT<L>>;
    }
    function cleanupLanguage<L>(
        la: Data.Maybe<LanguageT<L>>,
        fs: ReadonlySet<FeatureT<L>>
    ): null | LanguageT<L> {
        if (!la) return null;
        const requiredFeature1 = RectifyImpl.Elim.findInSet(la.requiredFeature, fs);
        const features1 = RectifyImpl.Elim.listSome(la.features, fs);
        if (!features1 && !requiredFeature1) return null;
        return { requiredFeature: requiredFeature1, features: features1 };
    }

    export interface ScriptT<L> {
        defaultLanguage: Data.Maybe<LanguageT<L>>;
        languages: Map<Tag, LanguageT<L>>;
    }
    function cleanupScript<L>(sc: ScriptT<L>, fs: ReadonlySet<FeatureT<L>>): null | ScriptT<L> {
        const defaultLanguage = cleanupLanguage(sc.defaultLanguage, fs);
        const languages = RectifyImpl.Elim.comapSomeT(sc.languages, cleanupLanguage, fs);
        if (!defaultLanguage && !languages.size) return null;
        else return { defaultLanguage, languages };
    }

    export interface AxisRangeConditionT<A> {
        axis: A;
        min: F2D14;
        max: F2D14;
    }
    export type FeatureVariationConditionT<A> = AxisRangeConditionT<A>;
    export interface FeatureVariationT<A, L> {
        conditions: Array<FeatureVariationConditionT<A>>;
        substitutions: Map<FeatureT<L>, FeatureT<L>>;
    }
    function axesRectifyFeatureVariation<A, L>(
        rec: Rectify.Axis.RectifierT<A>,
        fv: FeatureVariationT<A, L>
    ) {
        fv.conditions = RectifyImpl.listSomeT(rec, fv.conditions, (r, c) => {
            const a1 = r.axis(c.axis);
            if (a1) return { ...c, axis: a1 };
            else return null;
        });
    }
    function cleanupFeatureVariation<A, L>(
        fv: FeatureVariationT<A, L>,
        ls: ReadonlySet<L>,
        fs: ReadonlySet<FeatureT<L>>
    ): null | FeatureVariationT<A, L> {
        let subst: Map<FeatureT<L>, FeatureT<L>> = new Map();
        for (const [from, to] of fv.substitutions) {
            const from1 = RectifyImpl.Elim.findInSet(from, fs);
            const to1 = cleanupFeature(to, ls);
            if (from1 && to1) subst.set(from1, to1);
        }
        if (!subst.size) return null;
        else return { ...fv, substitutions: subst };
    }

    export interface TableT<A, G, X, L>
        extends Trace.Glyph.TraceableT<G>,
            Rectify.Axis.RectifiableT<A>,
            Rectify.Glyph.RectifiableT<G>,
            Rectify.Coord.RectifiableT<X>,
            Rectify.PointAttach.NonTerminalT<G, X>,
            Rectify.Elim.Eliminable {
        scripts: Map<Tag, ScriptT<L>>;
        features: Array<FeatureT<L>>;
        lookups: L[];
        FeatureVariations: Data.Maybe<Array<FeatureVariationT<A, L>>>;
    }

    // Shared data types
    export interface Lookup extends GeneralLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export type ChainingApplication = ChainingApplicationT<Lookup>;
    export type ChainingRule = ChainingRuleT<Set<OtGlyph>, Lookup>;
    export type ChainingClassRule = ChainingRuleT<number, Lookup>;
    export type ChainingLookup = ForwardChainingLookupT<OtGlyph, OtVar.Value, GsubGpos.Lookup>;

    // exported class
    export class TableImpl implements TableT<OtVar.Axis, OtGlyph, OtVar.Value, Lookup> {
        constructor(
            public scripts: Map<Tag, ScriptT<Lookup>> = new Map(),
            public features: Array<FeatureT<Lookup>> = [],
            public lookups: Lookup[] = [],
            public FeatureVariations: Data.Maybe<
                Array<FeatureVariationT<OtVar.Axis, Lookup>>
            > = null
        ) {}

        // Rectification
        public traceGlyphs(tracer: Trace.Glyph.TracerT<OtGlyph>) {
            for (const lookup of this.lookups) lookup.traceGlyphs(tracer);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<OtGlyph>) {
            for (const lookup of this.lookups) lookup.rectifyGlyphs(rec);
        }
        public rectifyCoords(rec: Rectify.Coord.RectifierT<OtVar.Value>) {
            for (const lookup of this.lookups) lookup.rectifyCoords(rec);
        }
        public rectifyAxes(rec: Rectify.Axis.RectifierT<OtVar.Axis>) {
            if (this.FeatureVariations) {
                for (const fv of this.FeatureVariations) axesRectifyFeatureVariation(rec, fv);
            }
        }
        // Cleanup
        private cleanupLookups() {
            let elim = false;
            let lookups: Lookup[] = this.lookups;
            do {
                elim = false;
                const lookupSet: Set<Lookup> = new Set(lookups);
                const rect: Rectify.Lookup.RectifierT<Lookup> = {
                    lookup: l => (lookupSet.has(l) ? l : null)
                };
                let lookups1: Lookup[] = [];
                for (const lookup of lookups) {
                    lookup.rectifyLookups(rect);
                    if (lookup.cleanupEliminable()) {
                        elim = true;
                    } else {
                        lookups1.push(lookup);
                    }
                }
                lookups = lookups1;
            } while (elim);
            this.lookups = lookups;
            return new Set(lookups);
        }
        private cleanupFeatures(lookupSet: ReadonlySet<Lookup>) {
            this.features = RectifyImpl.Elim.listSomeT(this.features, cleanupFeature, lookupSet);
            return new Set(this.features);
        }
        private cleanupScripts(featureSet: ReadonlySet<FeatureT<Lookup>>) {
            this.scripts = RectifyImpl.Elim.comapSomeT(this.scripts, cleanupScript, featureSet);
        }
        private cleanupFeatureVariations(
            lookupSet: ReadonlySet<Lookup>,
            featureSet: ReadonlySet<FeatureT<Lookup>>
        ) {
            if (!this.FeatureVariations) return;
            this.FeatureVariations = RectifyImpl.Elim.listSomeT(
                this.FeatureVariations,
                cleanupFeatureVariation,
                lookupSet,
                featureSet
            );
            if (!this.FeatureVariations.length) this.FeatureVariations = null;
        }
        public cleanupEliminable() {
            const lookupSet = this.cleanupLookups();
            const featureSet = this.cleanupFeatures(lookupSet);
            this.cleanupScripts(featureSet);
            this.cleanupFeatureVariations(lookupSet, featureSet);
            return !this.lookups.length || !this.scripts.size || !this.features.length;
        }
        public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<OtGlyph, OtVar.Value>) {
            for (const lookup of this.lookups) lookup.rectifyPointAttachment(rec);
        }
    }
}

export namespace Gsub {
    export const Tag = "GSUB";

    export type Table = GsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value, Lookup>;
    export const Table = GsubGpos.TableImpl;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Lookup = GsubGpos.Lookup;
    export type AxisRangeCondition = GsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GsubGpos.FeatureVariationT<OtVar.Axis, Lookup>;

    // Lookup classes
    export class Single extends GsubSingleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Multiple extends GsubMultipleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Alternate extends GsubAlternateLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Ligature extends GsubLigatureLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Chaining extends ForwardChainingLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class ReverseSub extends GsubReverseSingleSubT<OtGlyph, OtVar.Value, Lookup> {}

    // Lookup-internal data types
    export type ChainingApplication = GsubGpos.ChainingApplication;
    export type ChainingRule = GsubGpos.ChainingRule;
    export type ChainingClassRule = GsubGpos.ChainingClassRule;

    export type ReverseRuleSubst = GsubReverseSubstT<OtGlyph>;
    export type ReverseRule = GsubReverseRuleT<OtGlyph, Set<OtGlyph>>;
}

export namespace Gpos {
    export const Tag = "GPOS";

    export type Table = GsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value, Lookup>;
    export const Table = GsubGpos.TableImpl;
    export type Script = GsubGpos.ScriptT<Lookup>;
    export type Language = GsubGpos.LanguageT<Lookup>;
    export type Feature = GsubGpos.FeatureT<Lookup>;
    export type Lookup = GsubGpos.Lookup;
    export type AxisRangeCondition = GsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariationCondition = GsubGpos.AxisRangeConditionT<OtVar.Axis>;
    export type FeatureVariation = GsubGpos.FeatureVariationT<OtVar.Axis, Lookup>;

    // Lookup classes
    export class Single extends GposSingleLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Pair extends GposPairLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Cursive extends GposCursiveLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToBase extends GposMarkToBaseLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToLigature extends GposMarkToLigatureLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class MarkToMark extends GposMarkToMarkLookupT<OtGlyph, OtVar.Value, Lookup> {}
    export class Chaining extends ForwardChainingLookupT<OtGlyph, OtVar.Value, Lookup> {}

    // Lookup-internal data type aliases
    export type Adjustment = LayoutCommon.Adjust.T<OtVar.Value>;
    export type AdjustmentPair = LayoutCommon.Adjust.PairT<OtVar.Value>;
    export type Anchor = LayoutCommon.Anchor.T<OtVar.Value>;
    export type CursiveAnchorPair = LayoutCommon.CursiveAnchorPair.T<OtVar.Value>;

    export type MarkRecord = GposMarkRecordT<OtVar.Value>;
    export type BaseRecord = GposBaseRecordT<OtVar.Value>;
    export type LigatureRecord = GposLigatureRecordT<OtVar.Value>;

    export type ChainingApplication = GsubGpos.ChainingApplication;
    export type ChainingRule = GsubGpos.ChainingRule;
    export type ChainingClassRule = GsubGpos.ChainingClassRule;

    // Zeroes
    export const ZeroAdjustment: Adjustment = { dX: 0, dY: 0, dWidth: 0, dHeight: 0 };
    export const ZeroAdjustmentPair: AdjustmentPair = [ZeroAdjustment, ZeroAdjustment];
}
