import { GsubMultipleAlternatePropT, LookupAlgT, LookupT } from "./general";

export class GsubMultipleLookupBaseT<G, X> {
    public mapping: Map<G, ReadonlyArray<G>> = new Map();
}

export class GsubMultipleLookupT<G, X> extends GsubMultipleLookupBaseT<G, X>
    implements GsubMultipleAlternatePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gsubMulti(this);
    }
}

export class GsubAlternateLookupT<G, X> extends GsubMultipleLookupBaseT<G, X>
    implements GsubMultipleAlternatePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gsubAlternate(this);
    }
}
