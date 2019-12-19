import * as Ot from "@ot-builder/font";
import { Delay } from "@ot-builder/prelude";

import {
    AxisRectifier,
    CoordRectifier,
    GlyphRectifier,
    PointAttachmentRectifier
} from "../../interface";

import { axesRectifyFeatureVariation, cleanupGsubGposData } from "./cleanup";
import { LookupRemovableAlg } from "./lookup-removable-alg";
import {
    RectifyGposGlyphCoordAlg,
    RectifyGsubGlyphCoordAlg,
    rectifyLookupList
} from "./rectify-alg";

function fnApplyGsubLookup(lookup: Ot.Gsub.Lookup, alg: RectifyGsubGlyphCoordAlg) {
    return alg.crossReference(
        lookup,
        Delay(() => lookup.apply(alg))
    );
}
function fnGsubLookupRemovable(lookup: Ot.Gsub.Lookup) {
    return lookup.apply(LookupRemovableAlg);
}
function fnApplyGposLookup(lookup: Ot.Gpos.Lookup, alg: RectifyGposGlyphCoordAlg) {
    return alg.crossReference(
        lookup,
        Delay(() => lookup.apply(alg))
    );
}
function fnGposLookupRemovable(lookup: Ot.Gpos.Lookup) {
    return lookup.apply(LookupRemovableAlg);
}

export function rectifyGsubGlyphs(table: Ot.Gsub.Table, rec: GlyphRectifier) {
    const alg = new RectifyGsubGlyphCoordAlg(rec, { coord: x => x, cv: x => x }, null);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGsubLookup);
    return cleanupGsubGposData(
        table,
        Ot.Gsub.Table.create(),
        lookupCorrespondence,
        fnGsubLookupRemovable
    );
}
export function rectifyGsubCoord(
    table: Ot.Gsub.Table,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier
) {
    const alg = new RectifyGsubGlyphCoordAlg({ glyph: g => g }, recCoord, null);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGsubLookup);
    const newTable = cleanupGsubGposData(
        table,
        Ot.Gsub.Table.create(),
        lookupCorrespondence,
        fnGsubLookupRemovable
    );
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
export function rectifyGsubPointAttachment(table: Ot.Gsub.Table, recPA: PointAttachmentRectifier) {
    const alg = new RectifyGsubGlyphCoordAlg(
        { glyph: g => g },
        { coord: x => x, cv: x => x },
        recPA
    );
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGsubLookup);
    return cleanupGsubGposData(
        table,
        Ot.Gsub.Table.create(),
        lookupCorrespondence,
        fnGsubLookupRemovable
    );
}

export function rectifyGposGlyphs(table: Ot.Gpos.Table, rec: GlyphRectifier) {
    const alg = new RectifyGposGlyphCoordAlg(rec, { coord: x => x, cv: x => x }, null);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGposLookup);
    return cleanupGsubGposData(
        table,
        Ot.Gpos.Table.create(),
        lookupCorrespondence,
        fnGposLookupRemovable
    );
}
export function rectifyGposCoord(
    table: Ot.Gpos.Table,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier
) {
    const alg = new RectifyGposGlyphCoordAlg({ glyph: g => g }, recCoord, null);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGposLookup);
    const newTable = cleanupGsubGposData(
        table,
        Ot.Gpos.Table.create(),
        lookupCorrespondence,
        fnGposLookupRemovable
    );
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
export function rectifyGposPointAttachment(table: Ot.Gpos.Table, recPA: PointAttachmentRectifier) {
    const alg = new RectifyGposGlyphCoordAlg(
        { glyph: g => g },
        { coord: x => x, cv: x => x },
        recPA
    );
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGposLookup);
    return cleanupGsubGposData(
        table,
        Ot.Gpos.Table.create(),
        lookupCorrespondence,
        fnGposLookupRemovable
    );
}
