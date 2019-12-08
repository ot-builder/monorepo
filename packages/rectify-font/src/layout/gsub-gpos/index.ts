import * as Ot from "@ot-builder/font";
import { Rectify } from "@ot-builder/prelude";

import { axesRectifyFeatureVariation, cleanupGsubGposData } from "./cleanup";
import { RectifyGlyphCoordAlg } from "./rectify-alg";

function processTableLookups<Table extends Ot.GsubGpos.Table>(
    table: Table,
    alg: RectifyGlyphCoordAlg
) {
    let lookupCorrespondence: Map<Ot.GsubGpos.Lookup, Ot.GsubGpos.Lookup> = new Map();
    let transformedLookups: Set<Ot.GsubGpos.Lookup> = new Set();
    for (const lookup of table.lookups) {
        const transformed = lookup.acceptLookupAlgebra(alg);
        lookupCorrespondence.set(lookup, transformed);
        transformedLookups.add(transformed);
    }
    let extraLookups: Set<Ot.GsubGpos.Lookup> = new Set();
    for (const lookup of alg.allLookups()) {
        if (!transformedLookups.has(lookup)) extraLookups.add(lookup);
    }

    return { lookupCorrespondence, extraLookups };
}

export function rectifyLayoutGlyphs<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    rec: Rectify.Glyph.RectifierT<Ot.Glyph>
) {
    const { lookupCorrespondence, extraLookups } = processTableLookups(
        table,
        new RectifyGlyphCoordAlg(rec, { coord: x => x, cv: x => x }, null)
    );
    return cleanupGsubGposData(table, tableFactory, lookupCorrespondence, extraLookups);
}

export function rectifyLayoutCoord<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    recAxes: Rectify.Axis.RectifierT<Ot.Fvar.Axis>,
    recCoord: Rectify.Coord.RectifierT<Ot.Var.Value>
) {
    const { lookupCorrespondence, extraLookups } = processTableLookups(
        table,
        new RectifyGlyphCoordAlg({ glyph: g => g }, recCoord, null)
    );
    const newTable = cleanupGsubGposData(table, tableFactory, lookupCorrespondence, extraLookups);
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
export function rectifyLayoutPointAttachment<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    recPA: Rectify.PointAttach.RectifierT<Ot.Glyph, Ot.Var.Value>
) {
    const { lookupCorrespondence, extraLookups } = processTableLookups(
        table,
        new RectifyGlyphCoordAlg({ glyph: g => g }, { coord: x => x, cv: x => x }, recPA)
    );
    return cleanupGsubGposData(table, tableFactory, lookupCorrespondence, extraLookups);
}
