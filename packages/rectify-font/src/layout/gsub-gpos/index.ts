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
import { RectifyGposGlyphCoordAlg, RectifyGsubGlyphCoordAlg, rectifyLookupList } from "./rectify";

function fnApplyGsubLookup(lookup: Ot.Gsub.Lookup, alg: RectifyGsubGlyphCoordAlg) {
    return alg.process(lookup);
}
function fnGsubLookupRemovable(lookup: Ot.Gsub.Lookup) {
    return LookupRemovableAlg.process(lookup);
}
function fnApplyGposLookup(lookup: Ot.Gpos.Lookup, alg: RectifyGposGlyphCoordAlg) {
    return alg.process(lookup);
}
function fnGposLookupRemovable(lookup: Ot.Gpos.Lookup) {
    return LookupRemovableAlg.process(lookup);
}

export function rectifyGsubGlyphs(rec: GlyphRectifier, table: Ot.Gsub.Table) {
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
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    table: Ot.Gsub.Table
) {
    const alg = new RectifyGsubGlyphCoordAlg({ glyph: g => g }, recCoord, recPA);
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

export function rectifyGposGlyphs(rec: GlyphRectifier, table: Ot.Gpos.Table) {
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
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    table: Ot.Gpos.Table
) {
    const alg = new RectifyGposGlyphCoordAlg({ glyph: g => g }, recCoord, recPA);
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
