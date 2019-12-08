import { GsubGpos } from "@ot-builder/ft-layout";
import { Tag } from "@ot-builder/primitive";

import { SubtableWriteTrick } from "./general";

export function setLookupTricks(table: GsubGpos.Table) {
    const tricks: Map<GsubGpos.Lookup, number> = new Map();
    return tricks;
}

function setLookupTrickByFeatureTag(
    table: GsubGpos.Table,
    tricks: Map<GsubGpos.Lookup, number>,
    tagSet: Set<Tag>,
    trick: number
) {
    for (const feature of table.features) {
        if (tagSet.has(feature.tag)) {
            setTricksForLookupSet(tricks, feature.lookups, trick);
        }
    }
    if (table.featureVariations) {
        for (const fv of table.featureVariations) {
            for (const [from, to] of fv.substitutions) {
                if (tagSet.has(from.tag)) setTricksForLookupSet(tricks, to.lookups, trick);
            }
        }
    }
}

function setTricksForLookupSet(
    tricks: Map<GsubGpos.Lookup, number>,
    lookups: Iterable<GsubGpos.Lookup>,
    trick: number
) {
    for (const lookup of lookups) {
        tricks.set(lookup, (tricks.get(lookup) || 0) | trick);
    }
}
