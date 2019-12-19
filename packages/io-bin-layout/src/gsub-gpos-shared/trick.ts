import { GsubGpos } from "@ot-builder/ft-layout";
import { Tag } from "@ot-builder/primitive";

export function setLookupTricks<L>(table: GsubGpos.Table<L>) {
    const tricks: Map<L, number> = new Map();
    return tricks;
}

function setLookupTrickByFeatureTag<L>(
    table: GsubGpos.Table<L>,
    tricks: Map<L, number>,
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

function setTricksForLookupSet<L>(tricks: Map<L, number>, lookups: Iterable<L>, trick: number) {
    for (const lookup of lookups) {
        tricks.set(lookup, (tricks.get(lookup) || 0) | trick);
    }
}
