import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gsub } from "@ot-builder/ot-layout";

import { BimapCtx, StdCompare } from "../../compar-util";
import * as FastMatch from "../../fast-match";

// We treat two GSUB ligature lookup being identical, if for any initial glyph, the mapping
// list started with this initial are the same, including the order (since for ligature
// substitution, the order matters).
function testSingle(bmg: BimapCtx<OtGlyph>, expected: Gsub.Ligature, actual: Gsub.Ligature) {
    const processedInitials: Set<OtGlyph> = new Set();
    const processedExpectedMappingIndices: Set<number> = new Set();
    const processedActualMappingIndices: Set<number> = new Set();

    for (let rid = 0; rid < expected.mapping.length; rid++) {
        const initial = expected.mapping[rid].from[0];
        if (processedInitials.has(initial)) continue;
        processedInitials.add(initial);

        const expectedMappings = collectMappings(
            initial,
            processedExpectedMappingIndices,
            expected.mapping
        );
        const actualMappings = collectMappings(
            bmg.forward(initial),
            processedActualMappingIndices,
            actual.mapping
        );

        compareMappingLists(bmg, expectedMappings, actualMappings);
    }
}

function compareMappingLists(
    bmg: BimapCtx<OtGlyph>,
    expectedMappings: ReadonlyArray<Gsub.LigatureEntry>,
    actualMappings: ReadonlyArray<Gsub.LigatureEntry>
) {
    FastMatch.truly(expectedMappings.length > 0);
    FastMatch.exactly(expectedMappings.length, actualMappings.length);
    for (let mid = 0; mid < expectedMappings.length; mid++) {
        const entryExpected = expectedMappings[mid];
        const entryActual = actualMappings[mid];
        FastMatch.exactly(entryActual.from.length, entryExpected.from.length);
        for (let ix = 0; ix < entryExpected.from.length; ix++) {
            FastMatch.exactly(entryActual.from[ix], bmg.forward(entryExpected.from[ix]));
        }
        FastMatch.exactly(entryActual.to, bmg.forward(entryExpected.to));
    }
}

function collectMappings(
    expectedInitial: OtGlyph,
    processed: Set<number>,
    mappings: ReadonlyArray<Gsub.LigatureEntry>
) {
    const results: Gsub.LigatureEntry[] = [];
    for (let rid = 0; rid < mappings.length; rid++) {
        if (processed.has(rid)) continue;
        const initial = mappings[rid].from[0];
        if (initial !== expectedInitial) continue;
        processed.add(rid);
        results.push(mappings[rid]);
    }
    return results;
}

export const test = StdCompare(testSingle);
