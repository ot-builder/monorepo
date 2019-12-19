import { Constant } from "@ot-builder/prelude";

import { GsubLookupAlgT, GsubLookupT, GsubSinglePropT } from "../general/lookup";

export class GsubSingleLookupT<G, X> implements GsubSinglePropT<G, X>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Map<G, G> = new Map();
    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubSingle(Constant(this));
    }
}
