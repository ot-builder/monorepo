import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

import { FeatureT, FeatureVariationT, ScriptT, TableT } from "../general/shared";

// exported class
export class TableImpl<A, G, X, L> implements TableT<A, G, X, L> {
    constructor(
        public scripts: Map<Tag, ScriptT<G, X, L>>,
        public features: Array<FeatureT<G, X, L>>,
        public lookups: L[],
        public featureVariations: Data.Maybe<Array<FeatureVariationT<A, G, X, L>>>
    ) {}
}
