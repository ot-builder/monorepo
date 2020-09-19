import * as Ot from "@ot-builder/ot";

import {
    AxisRectifier,
    CoordRectifier,
    GlyphReferenceRectifier,
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

export function rectifyGsubTable(
    recGlyphs: GlyphReferenceRectifier,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    table: Ot.Gsub.Table
) {
    const alg = new RectifyGsubGlyphCoordAlg(recGlyphs, recCoord, recPA);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGsubLookup);
    const newTable = cleanupGsubGposData(
        table,
        new Ot.Gsub.Table(),
        lookupCorrespondence,
        fnGsubLookupRemovable
    );
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}

export function rectifyGposTable(
    recGlyphs: GlyphReferenceRectifier,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    table: Ot.Gpos.Table
) {
    const alg = new RectifyGposGlyphCoordAlg(recGlyphs, recCoord, recPA);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, fnApplyGposLookup);
    const newTable = cleanupGsubGposData(
        table,
        new Ot.Gpos.Table(),
        lookupCorrespondence,
        fnGposLookupRemovable
    );
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
