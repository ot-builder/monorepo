import { Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gdef } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { ZipWithIndex } from "@ot-builder/prelude/lib/control";
import { ReadTimeIVS, WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { CovUtils, GidCoverage } from "../shared/coverage";

import { CaretValue } from "./lig-caret-value";

type CaretList = Gdef.LigCaretListT<OtGlyph, OtVar.Value>;

export const LigCaretList = {
    ...Read((view, gOrd: Data.Order<OtGlyph>, ivs?: Data.Maybe<ReadTimeIVS>) => {
        const gidCov = view.ptr16().next(GidCoverage);
        const glyphCount = view.uint16();
        Assert.SizeMatch("AttachList::glyphCount", glyphCount, gidCov.length);
        const lcl: CaretList = new Map();
        for (const gid of gidCov) {
            const caretCount = view.uint16();
            const carets = view.array(caretCount, CaretValue, ivs);
            lcl.set(gOrd.at(gid), carets);
        }
        return lcl;
    }),
    ...Write((frag, atl: CaretList, gOrd: Data.Order<OtGlyph>, ivs?: Data.Maybe<WriteTimeIVS>) => {
        const { gidList, values: points } = CovUtils.splitListFromMap(atl, gOrd);
        frag.ptr16New().push(GidCoverage, gidList);
        frag.uint16(gidList.length);
        for (const [gid, pl] of ZipWithIndex(gidList, points)) {
            frag.uint16(pl.length);
            for (const z of pl) frag.push(CaretValue, z, ivs);
        }
    })
};
