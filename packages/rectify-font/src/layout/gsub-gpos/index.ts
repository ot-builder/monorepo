import * as Ot from "@ot-builder/font";

import {
    AxisRectifier,
    CoordRectifier,
    GlyphRectifier,
    PointAttachmentRectifier
} from "../../interface";

import { axesRectifyFeatureVariation, cleanupGsubGposData } from "./cleanup";
import { RectifyGlyphCoordAlg, rectifyLookupList } from "./rectify-alg";

export function rectifyLayoutGlyphs<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    rec: GlyphRectifier
) {
    const lookupCorrespondence = rectifyLookupList(
        table.lookups,
        new RectifyGlyphCoordAlg(rec, { coord: x => x, cv: x => x }, null)
    );
    return cleanupGsubGposData(table, tableFactory, lookupCorrespondence);
}

export function rectifyLayoutCoord<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    recAxes: AxisRectifier,
    recCoord: CoordRectifier
) {
    const lookupCorrespondence = rectifyLookupList(
        table.lookups,
        new RectifyGlyphCoordAlg({ glyph: g => g }, recCoord, null)
    );
    const newTable = cleanupGsubGposData(table, tableFactory, lookupCorrespondence);
    if (newTable && newTable.featureVariations) {
        for (const fv of newTable.featureVariations) axesRectifyFeatureVariation(recAxes, fv);
    }
    return newTable;
}
export function rectifyLayoutPointAttachment<Table extends Ot.GsubGpos.Table>(
    table: Table,
    tableFactory: () => Table,
    recPA: PointAttachmentRectifier
) {
    const lookupCorrespondence = rectifyLookupList(
        table.lookups,
        new RectifyGlyphCoordAlg({ glyph: g => g }, { coord: x => x, cv: x => x }, recPA)
    );
    return cleanupGsubGposData(table, tableFactory, lookupCorrespondence);
}
