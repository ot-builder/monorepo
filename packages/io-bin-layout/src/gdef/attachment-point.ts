import { Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

import { CovUtils, GidCoverage } from "../shared/coverage";

export const GdefAttachmentPointList = {
    ...Read((view, gOrd: Data.Order<OtGlyph>) => {
        const gidCov = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch("AttachList::glyphCount", glyphCount, gidCov.length);
        const atp: Gdef.AttachPointList = new Map();
        for (const gid of gidCov) {
            const pointCount = view.uint16();
            const pointIndices = view.array(pointCount, UInt16);
            atp.set(gOrd.at(gid), pointIndices.map(z => ({ pointIndex: z })));
        }
        return atp;
    }),
    ...Write((frag, atl: Gdef.AttachPointList, gOrd: Data.Order<OtGlyph>) => {
        const { gidList, values: points } = CovUtils.splitListFromMap(atl, gOrd);
        frag.ptr16New().push(GidCoverage, gidList);
        frag.uint16(gidList.length);
        for (const [gid, pl] of ImpLib.Iterators.ZipWithIndex(gidList, points)) {
            frag.uint16(pl.length);
            for (const z of pl) frag.uint16(z.pointIndex);
        }
    })
};
