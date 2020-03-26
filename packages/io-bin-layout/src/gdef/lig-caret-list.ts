import { Read, Write } from "@ot-builder/bin-util";
import { ImpLib } from "@ot-builder/common-impl";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gdef } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";

import { CovUtils, GidCoverage } from "../shared/coverage";

import { CaretValue } from "./lig-caret-value";

export const LigCaretList = {
    ...Read((view, gOrd: Data.Order<OtGlyph>, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const gidCov = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch("AttachList::glyphCount", glyphCount, gidCov.length);
        const lcl: Gdef.LigCaretList = new Map();
        for (const gid of gidCov) {
            const caretCount = view.uint16();
            const carets = view.array(caretCount, CaretValue, ivs);
            lcl.set(gOrd.at(gid), carets);
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
                frag.uint16(pl.length);
                for (const z of pl) frag.push(CaretValue, z, ivs);
            }
        }
    )
};
