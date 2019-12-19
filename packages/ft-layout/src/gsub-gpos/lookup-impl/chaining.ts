import { Delay } from "@ot-builder/prelude";

import {
    ChainingApplicationT,
    ChainingRuleT,
    ForwardChainingPropT,
    GposLookupAlgT,
    GposLookupT,
    GsubLookupAlgT,
    GsubLookupT,
    LookupAlgT
} from "../general/lookup";

// I hate duplicating code, but TypeScript is not strong enough to eliminate the duplication
export class GsubChainingLookupT<G, X>
    implements ForwardChainingPropT<G, X, GsubLookupT<G, X>>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, GsubLookupT<G, X>>[] = [];

    public apply<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gsubChaining(Delay(() => this.getProps(alg)));
    }
    protected getProps<E>(alg: GsubLookupAlgT<G, X, E>): ForwardChainingPropT<G, X, E> {
        const rules1: ChainingRuleT<Set<G>, E>[] = [];
        for (const rule of this.rules) {
            const applications1: ChainingApplicationT<E>[] = [];
            for (const app of rule.applications) {
                const lookupE: E = alg.crossReference
                    ? alg.crossReference(
                          app.apply,
                          Delay(() => app.apply.apply(alg))
                      )
                    : app.apply.apply(alg);
                applications1.push({ at: app.at, apply: lookupE });
            }
            rules1.push({ ...rule, applications: applications1 });
        }
        return {
            rightToLeft: this.rightToLeft,
            ignoreGlyphs: this.ignoreGlyphs,
            rules: rules1
        };
    }
}

export class GposChainingLookupT<G, X>
    implements ForwardChainingPropT<G, X, GposLookupT<G, X>>, GposLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: ChainingRuleT<Set<G>, GposLookupT<G, X>>[] = [];

    public apply<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gposChaining(Delay(() => this.getProps(alg)));
    }
    protected getProps<E>(alg: GposLookupAlgT<G, X, E>): ForwardChainingPropT<G, X, E> {
        const rules1: ChainingRuleT<Set<G>, E>[] = [];
        for (const rule of this.rules) {
            const applications1: ChainingApplicationT<E>[] = [];
            for (const app of rule.applications) {
                const lookupE: E = alg.crossReference
                    ? alg.crossReference(
                          app.apply,
                          Delay(() => app.apply.apply(alg))
                      )
                    : app.apply.apply(alg);
                applications1.push({ at: app.at, apply: lookupE });
            }
            rules1.push({ ...rule, applications: applications1 });
        }
        return {
            rightToLeft: this.rightToLeft,
            ignoreGlyphs: this.ignoreGlyphs,
            rules: rules1
        };
    }
}
