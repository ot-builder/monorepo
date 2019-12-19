import { Constant } from "@ot-builder/prelude";

import {
    GsubLookupAlgT,
    GsubLookupT,
    GsubReverseRuleT,
    GsubReverseSingleSubPropT
} from "../general/lookup";

export class GsubReverseSingleSubLookupT<G, X>
    implements GsubReverseSingleSubPropT<G, X>, GsubLookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public rules: GsubReverseRuleT<G, Set<G>>[] = [];
    public apply<E>(alg: GsubLookupAlgT<G, X, E>): E {
        return alg.gsubReverse(Constant(this));
    }
}
