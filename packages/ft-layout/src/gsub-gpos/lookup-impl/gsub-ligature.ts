import { Constant } from "@ot-builder/prelude";

import {
    GsubLigatureLookupEntryT,
    GsubLigaturePropT,
    GsubLookupAlgT,
    GsubLookupT
} from "../general/lookup";

export class GsubLigatureLookupT<G, X> implements GsubLigaturePropT<G, X>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public mapping: Array<GsubLigatureLookupEntryT<G>> = [];

    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubLigature(Constant(this));
    }
}
