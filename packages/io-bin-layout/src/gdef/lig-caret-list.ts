import { Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGeometryHandler, OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";

import { CovUtils, GidCoverage } from "../shared/coverage";

import { LigGlyph } from "./lig-glyph";

export const LigCaretList = {
    ...Read((view, gOrd: Data.Order<OtGlyph>, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const gidCov = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch("AttachList::glyphCount", glyphCount, gidCov.length);
        const lcl: Gdef.LigCaretList = new Map();
        for (const gid of gidCov) {
            const glyph = gOrd.at(gid);
            const carets = postReadCaretList(glyph, view.ptr16().next(LigGlyph, ivs));
            lcl.set(glyph, carets);
        }
        return lcl;
    }),
    ...Write(
        (
            frag,
            atl: Gdef.LigCaretList,
            gOrd: Data.Order<OtGlyph>,
            ivs?: Data.Maybe<WriteTimeIVS>
        ) => {
            const { gidList, values: points } = CovUtils.splitListFromMap(atl, gOrd);
            frag.ptr16New().push(GidCoverage, gidList);
            frag.uint16(gidList.length);
            for (const [gid, pl] of ImpLib.Iterators.ZipWithIndex(gidList, points)) {
                frag.ptr16New().push(LigGlyph, pl, ivs);
            }
        }
    )
};

function postReadCaretList(glyph: OtGlyph, carets: Gdef.LigCaret[]) {
    const results: Gdef.LigCaret[] = [];
    for (const caret of carets) results.push(computeCaretXFromPointAttachment(glyph, caret));
    return results;
}

function computeCaretXFromPointAttachment(glyph: OtGlyph, caret: Gdef.LigCaret) {
    if (!caret.pointAttachment) return caret;
    const glyphPoints = OtGeometryHandler.stat(OtGeometryHandler.ListPoint, glyph.geometry);
    if (!glyphPoints || caret.pointAttachment.pointIndex >= glyphPoints.length) return caret;
    return { ...caret, x: glyphPoints[caret.pointAttachment.pointIndex].x };
}
