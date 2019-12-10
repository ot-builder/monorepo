import { Const } from "@ot-builder/prelude";

import { GsubSinglePropT, LookupAlgT, LookupT } from "./general";

export class GsubSingleLookupT<G, X> implements GsubSinglePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Map<G, G> = new Map();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gsubSingle(Const(this));
    }
}
