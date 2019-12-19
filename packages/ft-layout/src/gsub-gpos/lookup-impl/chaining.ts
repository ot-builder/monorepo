import { Delay, Thunk } from "@ot-builder/prelude";

import {
    ChainingApplicationT,
    ChainingRuleT,
    ForwardChainingPropT,
    GposLookupAlgT,
    GposLookupT,
    GsubLookupAlgT,
    GsubLookupT
} from "../general/lookup";

class ChainingLookupBaseT<G, X, L> implements ForwardChainingPropT<G, X, L> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, L>[] = [];

    protected getPropsImpl<E>(fn: (lookup: L) => E): Thunk<ForwardChainingPropT<G, X, E>> {
        return Delay(() => {
            const rules1: ChainingRuleT<Set<G>, E>[] = [];
            for (const rule of this.rules) {
                const applications1: ChainingApplicationT<E>[] = [];
                for (const app of rule.applications) {
                    const lookupE: E = fn(app.apply);
                    applications1.push({ at: app.at, apply: lookupE });
                }
                rules1.push({ ...rule, applications: applications1 });
            }
            return {
                rightToLeft: this.rightToLeft,
                ignoreGlyphs: this.ignoreGlyphs,
                rules: rules1
            };
        });
    }
}

export class GsubChainingLookupT<G, X> extends ChainingLookupBaseT<G, X, GsubLookupT<G, X>>
    implements GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, GsubLookupT<G, X>>[] = [];

    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubChaining(
            this.getPropsImpl(a =>
                alg.crossReference
                    ? alg.crossReference(
                          a,
                          Delay(() => a.apply(alg))
                      )
                    : a.apply(alg)
            )
        );
    }
}

export class GposChainingLookupT<G, X> extends ChainingLookupBaseT<G, X, GposLookupT<G, X>>
    implements GposLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, GposLookupT<G, X>>[] = [];

    public apply<E>(alg: GposLookupAlgT<G, X, E>): E {
        return alg.gposChaining(
            this.getPropsImpl(a =>
                alg.crossReference
                    ? alg.crossReference(
                          a,
                          Delay(() => a.apply(alg))
                      )
                    : a.apply(alg)
            )
        );
    }
}
