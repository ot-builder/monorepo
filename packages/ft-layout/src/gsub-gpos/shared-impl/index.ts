import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

import { LookupT } from "../general/lookup";
import { FeatureT, FeatureVariationT, ScriptT, TableT } from "../general/shared";

// exported class
export class TableImpl<A, G, X> implements TableT<A, G, X> {
    constructor(
        public scripts: Map<Tag, ScriptT<G, X>>,
        public features: Array<FeatureT<G, X>>,
        public lookups: LookupT<G, X>[],
        public featureVariations: Data.Maybe<Array<FeatureVariationT<A, G, X>>>
    ) {}
}
