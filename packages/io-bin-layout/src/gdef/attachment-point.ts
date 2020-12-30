import { Frag, Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

import { LayoutCfg } from "../cfg";
import { CovUtils, GidCoverage } from "../shared/coverage";

export const GdefAttachmentPointList = {
    ...Read((view, gOrd: Data.Order<OtGlyph>) => {
        const gidCov = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch("AttachList::glyphCount", glyphCount, gidCov.length);
        const atp: Gdef.AttachPointList = new Map();
        for (const gid of gidCov) {
            const pAttachPoint = view.ptr16();
            const pointCount = pAttachPoint.uint16();
            const pointIndices = pAttachPoint.array(pointCount, UInt16);
            atp.set(
                gOrd.at(gid),
                pointIndices.map(z => ({ pointIndex: z }))
            );
        }
        return atp;
    }),
    ...Write((frag, atl: Gdef.AttachPointList, cfg: LayoutCfg, gOrd: Data.Order<OtGlyph>) => {
        const trick = cfg.layout.gdefWriteTrick || 0;
        const { gidList, values: points } = CovUtils.splitListFromMap(atl, gOrd);
        frag.ptr16New().push(GidCoverage, gidList, trick);
        frag.uint16(gidList.length);
        for (const [gid, pl] of ImpLib.Iterators.ZipWithIndex(gidList, points)) {
            const frAttPoint = frag.ptr16New();
            frAttPoint.uint16(pl.length);
            for (const z of pl) frAttPoint.uint16(z.pointIndex);
        }
    })
};
