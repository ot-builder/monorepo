import { RectifyImpl } from "@ot-builder/common-impl";
import { Caster, Data, Rectify, Trace } from "@ot-builder/prelude";
import { F2D14, Tag } from "@ot-builder/primitive";

import { GeneralLookupT } from "../lookup/general";

export namespace GeneralGsubGpos {
    export interface FeatureT<L> {
        tag: Tag;
        lookups: Array<L>;
        params?: Data.Maybe<Caster.Sigma>;
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
    export interface LookupT<G, X> extends GeneralLookupT<G, X, LookupT<G, X>> {}

    // exported class
    export class TableImpl<A, G, X> implements TableT<A, G, X, LookupT<G, X>> {
        constructor(
            public scripts: Map<Tag, ScriptT<LookupT<G, X>>> = new Map(),
            public features: Array<FeatureT<LookupT<G, X>>> = [],
            public lookups: LookupT<G, X>[] = [],
            public FeatureVariations: Data.Maybe<Array<FeatureVariationT<A, LookupT<G, X>>>> = null
        ) {}

        // Rectification
        public traceGlyphs(tracer: Trace.Glyph.TracerT<G>) {
            for (const lookup of this.lookups) lookup.traceGlyphs(tracer);
        }
        public rectifyGlyphs(rec: Rectify.Glyph.RectifierT<G>) {
            for (const lookup of this.lookups) lookup.rectifyGlyphs(rec);
        }
        public rectifyCoords(rec: Rectify.Coord.RectifierT<X>) {
            for (const lookup of this.lookups) lookup.rectifyCoords(rec);
        }
        public rectifyAxes(rec: Rectify.Axis.RectifierT<A>) {
            if (this.FeatureVariations) {
                for (const fv of this.FeatureVariations) axesRectifyFeatureVariation(rec, fv);
            }
        }
        // Cleanup
        private cleanupLookups() {
            let elim = false;
            let lookups: LookupT<G, X>[] = this.lookups;
            do {
                elim = false;
                const lookupSet: Set<LookupT<G, X>> = new Set(lookups);
                const rect: Rectify.Lookup.RectifierT<LookupT<G, X>> = {
                    lookup: l => (lookupSet.has(l) ? l : null)
                };
                let lookups1: LookupT<G, X>[] = [];
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
        private cleanupFeatures(lookupSet: ReadonlySet<LookupT<G, X>>) {
            this.features = RectifyImpl.Elim.listSomeT(this.features, cleanupFeature, lookupSet);
            return new Set(this.features);
        }
        private cleanupScripts(featureSet: ReadonlySet<FeatureT<LookupT<G, X>>>) {
            this.scripts = RectifyImpl.Elim.comapSomeT(this.scripts, cleanupScript, featureSet);
        }
        private cleanupFeatureVariations(
            lookupSet: ReadonlySet<LookupT<G, X>>,
            featureSet: ReadonlySet<FeatureT<LookupT<G, X>>>
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
        public rectifyPointAttachment(rec: Rectify.PointAttach.RectifierT<G, X>) {
            for (const lookup of this.lookups) lookup.rectifyPointAttachment(rec);
        }
    }
}
