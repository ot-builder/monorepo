import { Constant } from "@ot-builder/prelude";

import {
    GsubLigatureLookupEntryT,
    GsubLigaturePropT,
    LookupAlgT,
    LookupT
} from "../general/lookup";

export class GsubLigatureLookupT<G, X> implements GsubLigaturePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Array<GsubLigatureLookupEntryT<G>> = [];

    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gsubLigature(Constant(this));
    }
}
