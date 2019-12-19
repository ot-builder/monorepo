import { Constant } from "@ot-builder/prelude";

import { LayoutCommon } from "../../common";
import { GposCursivePropT, GposLookupAlgT, GposLookupT } from "../general/lookup";

export class GposCursiveLookupT<G, X> implements GposCursivePropT<G, X>, GposLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public attachments: Map<G, LayoutCommon.CursiveAnchorPair.T<X>> = new Map();
    public apply<E>(alg: GposLookupAlgT<G, X, E>): E {
        return alg.gposCursive(Constant(this));
    }
}
