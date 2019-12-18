import { Constant, Delay } from "@ot-builder/prelude";

import { LayoutCommon } from "../../common";
import { DicingStore, DicingStoreImpl } from "../../dicing-store";
import { GposPairPropT, LookupAlgT, LookupT } from "../general/lookup";

// We use a "flat" representation to record all the kerning data here
export class GposPairLookupT<G, X> implements GposPairPropT<G, X>, LookupT<G, X> {
    public rightToLeft = false;
    public ignoreGlyphs = new Set<G>();
    public adjustments: DicingStore<G, G, LayoutCommon.Adjust.PairT<X>> = new DicingStoreImpl();
    public acceptLookupAlgebra<E>(alg: LookupAlgT<G, X, E>): E {
        return alg.gposPair(Constant(this));
    }
}
