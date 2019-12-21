import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import * as GeneralGsubGpos from "./general/shared";
import { TableImpl } from "./shared-impl";

export function Creator<T, A extends [] = []>(cls: {
    new (...args: A): T;
}): { create(...args: A): T } {
    return { create: (...args: A): T => new cls(...args) };
}
export function CreateTable<L>() {
    return {
        create: function createTable(
            scripts: Map<Tag, GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value, L>> = new Map(),
            features: Array<GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value, L>> = [],
            lookups: Array<L> = [],
            featureVariations: Data.Maybe<
                Array<GeneralGsubGpos.FeatureVariationT<OtVar.Axis, OtGlyph, OtVar.Value, L>>
            > = undefined
        ): GeneralGsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value, L> {
            return new TableImpl(scripts, features, lookups, featureVariations);
        }
    };
}