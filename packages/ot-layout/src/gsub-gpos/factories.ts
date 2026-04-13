import type { OtGlyph } from "@ot-builder/ot-glyphs";
import type { Data } from "@ot-builder/prelude";
import type { Tag } from "@ot-builder/primitive";
import type { OtVar } from "@ot-builder/variance";

import type * as GeneralGsubGpos from "./general/shared";

export function CreateTable<L>() {
    return {
        create: function createTable(
            scripts: Map<Tag, GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value, L>> = new Map(),
            features: Array<GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value, L>> = [],
            lookups: Array<L> = [],
            featureVariations: Data.Maybe<
                Array<GeneralGsubGpos.FeatureVariationT<OtVar.Dim, OtGlyph, OtVar.Value, L>>
            > = undefined
        ): GeneralGsubGpos.TableT<OtVar.Dim, OtGlyph, OtVar.Value, L> {
            return { scripts, features, lookups, featureVariations };
        }
    };
}
