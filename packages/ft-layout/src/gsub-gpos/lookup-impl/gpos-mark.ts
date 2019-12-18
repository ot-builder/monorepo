import { Constant } from "@ot-builder/prelude";

import {
    GposBaseRecordT,
    GposLigatureBaseRecordT,
    GposMarkRecordT,
    GposMarkToBasePropT,
    GposMarkToLigaturePropT,
    GposMarkToMarkPropT,
    LookupAlgT,
    LookupT
} from "../general/lookup";

export class GposMarkLookupBaseT<G, X> {
    public marks = new Map<G, GposMarkRecordT<X>>();
}
export class GposMarkToBaseLookupT<G, X> extends GposMarkLookupBaseT<G, X>
    implements GposMarkToBasePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public bases = new Map<G, GposBaseRecordT<X>>();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gposMarkToBase(Constant(this));
    }
}
export class GposMarkToMarkLookupT<G, X> extends GposMarkLookupBaseT<G, X>
    implements GposMarkToMarkPropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public baseMarks = new Map<G, GposBaseRecordT<X>>();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gposMarkToMark(Constant(this));
    }
}
export class GposMarkToLigatureLookupT<G, X> extends GposMarkLookupBaseT<G, X>
    implements GposMarkToLigaturePropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public bases = new Map<G, GposLigatureBaseRecordT<X>>();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gposMarkToLigature(Constant(this));
    }
}
