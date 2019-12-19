import { Constant } from "@ot-builder/prelude";

import { GsubLookupAlgT, GsubLookupT, GsubMultipleAlternatePropT } from "../general/lookup";

export class GsubMultipleLookupBaseT<G, X> {
    public mapping: Map<G, ReadonlyArray<G>> = new Map();
}

export class GsubMultipleLookupT<G, X> extends GsubMultipleLookupBaseT<G, X>
    implements GsubMultipleAlternatePropT<G, X>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubMulti(Constant(this));
    }
}

export class GsubAlternateLookupT<G, X> extends GsubMultipleLookupBaseT<G, X>
    implements GsubMultipleAlternatePropT<G, X>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubAlternate(Constant(this));
    }
}
