import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Tag } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

import * as GeneralLookup from "./general/lookup";
import * as GeneralGsubGpos from "./general/shared";
import { TableImpl } from "./shared-impl";

function createTable(
    scripts: Map<Tag, GeneralGsubGpos.ScriptT<OtGlyph, OtVar.Value>> = new Map(),
    features: Array<GeneralGsubGpos.FeatureT<OtGlyph, OtVar.Value>> = [],
    lookups: Array<GeneralLookup.LookupT<OtGlyph, OtVar.Value>> = [],
    featureVariations: Data.Maybe<
        Array<GeneralGsubGpos.FeatureVariationT<OtVar.Axis, OtGlyph, OtVar.Value>>
    > = undefined
): GeneralGsubGpos.TableT<OtVar.Axis, OtGlyph, OtVar.Value> {
    return new TableImpl(scripts, features, lookups, featureVariations);
}

export function Creator<T, A extends [] = []>(cls: {
    new (...args: A): T;
}): { create(...args: A): T } {
    return { create: (...args: A): T => new cls(...args) };
}
export const CreateTable = { create: createTable };
