import { GeneralGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";

export namespace GeneralBase {
    export class TableT<G, X> {
        public horizontal: Data.Maybe<AxisTableT<G, X>> = null;
        public vertical: Data.Maybe<AxisTableT<G, X>> = null;
    }

    export class AxisTableT<G, X> {
        public baselineTags: Data.Maybe<Array<Tag>> = null;
        public scripts: Map<Tag, ScriptT<G, X>> = new Map();
    }

    export class ScriptT<G, X> {
        public baseValues: Data.Maybe<BaseValuesT<G, X>> = null;
        public defaultMinMax: Data.Maybe<MinMaxTableT<G, X>> = null;
        public baseLangSysRecords: Data.Maybe<Map<Tag, MinMaxTableT<G, X>>> = null;
    }

    export class BaseValuesT<G, X> {
        constructor(
            public defaultBaselineIndex: number = 0,
            public baseValues: Map<Tag, CoordT<G, X>> = new Map()
        ) {}
    }

    export class MinMaxTableT<G, X> {
        constructor(
            public defaultMinMax: MinMaxValueT<G, X>,
            public featMinMax: Map<Tag, MinMaxValueT<G, X>>
        ) {}
    }

    // Base coord
    export interface CoordT<G, X> {
        readonly at: X;
        readonly pointAttachment?: Data.Maybe<GeneralGlyph.GlyphPointIDRefT<G>>;
        readonly deviceDeltas?: Data.Maybe<ReadonlyArray<number>>;
    }

    // Min-max value pair
    export interface MinMaxValueT<G, X> {
        readonly minCoord: Data.Maybe<CoordT<G, X>>;
        readonly maxCoord: Data.Maybe<CoordT<G, X>>;
    }
}
