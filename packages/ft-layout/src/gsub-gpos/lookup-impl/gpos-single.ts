import { Constant } from "@ot-builder/prelude";

import { LayoutCommon } from "../../common";
import { GposLookupAlgT, GposLookupT, GposSinglePropT } from "../general/lookup";

export class GposSingleLookupT<G, X> implements GposSinglePropT<G, X>, GposLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public adjustments: Map<G, LayoutCommon.Adjust.T<X>> = new Map();

    public apply<E>(alg: GposLookupAlgT<G, X, E>): E {
        return alg.gposSingle(Constant(this));
    }
}
