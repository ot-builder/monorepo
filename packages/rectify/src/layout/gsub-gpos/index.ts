import * as Ot from "@ot-builder/ot";

import {
    AxisRectifier,
    CoordRectifier,
    GlyphReferenceRectifier,
    PointAttachmentRectifier
} from "../../interface";

import { axesRectifyFeatureVariation, cleanupGsubGposData } from "./cleanup";
import { LookupRemovableAlg, RemoveBrokenLinkAlg } from "./lookup-removable-alg";
import { RectifyGposGlyphCoordAlg, RectifyGsubGlyphCoordAlg, rectifyLookupList } from "./rectify";

export function rectifyGsubTable(
    recGlyphs: GlyphReferenceRectifier,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier,
    recPA: PointAttachmentRectifier,
    table: Ot.Gsub.Table
) {
    const alg = new RectifyGsubGlyphCoordAlg(recGlyphs, recCoord, recPA);
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, (l, a) => a.process(l));
    const newTable = cleanupGsubGposData(table, new Ot.Gsub.Table(), lookupCorrespondence, {
        lookupRemovable: l => LookupRemovableAlg.process(l),
        cleanupBrokenCrossLinks: (l, v) => RemoveBrokenLinkAlg.process(l, v)
    });
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
    const lookupCorrespondence = rectifyLookupList(table.lookups, alg, (l, a) => a.process(l));
    const newTable = cleanupGsubGposData(table, new Ot.Gpos.Table(), lookupCorrespondence, {
        lookupRemovable: l => LookupRemovableAlg.process(l),
        cleanupBrokenCrossLinks: (l, v) => RemoveBrokenLinkAlg.process(l, v)
    });
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
