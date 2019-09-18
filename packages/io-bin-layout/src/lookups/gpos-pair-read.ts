import { BinaryView } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Gpos, GsubGpos } from "@ot-builder/ft-layout";

import { LookupReader, SubtableReadingContext } from "../gsub-gpos-shared/general";
import { ClassDefUtil, Ptr16ClassDef } from "../shared/class-def";
import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";
import { GposAdjustment } from "../shared/gpos-adjust";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gpos.Pair, context: SubtableReadingContext<GsubGpos.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`PairPosFormat1`, format, 1);
        const cov = view.next(Ptr16GidCoverage);
        const valueFormat1 = view.uint16();
        const valueFormat2 = view.uint16();
        const pairSetCount = view.uint16();
        Assert.SizeMatch("PairPosFormat1::pairSetCount", pairSetCount, cov.length);
        for (const glyph1 of CovUtils.glyphsFromGidList(cov, context.gOrd)) {
            const vPairSet = view.ptr16();
            const pairValueCount = vPairSet.uint16();
            for (let pvi = 0; pvi < pairValueCount; pvi++) {
                const glyph2 = context.gOrd.at(vPairSet.uint16());
                const value1 = vPairSet.next(GposAdjustment, valueFormat1, context.ivs);
                const value2 = vPairSet.next(GposAdjustment, valueFormat2, context.ivs);
                lookup.adjustments.setIfAbsent(new Set([glyph1]), new Set([glyph2]), [
                    value1,
                    value2
                ]);
            }
        }
    }
};

const SubtableFormat2 = {
    read(view: BinaryView, lookup: Gpos.Pair, context: SubtableReadingContext<GsubGpos.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`PairPosFormat2`, format, 2);
        const cov = view.next(Ptr16GidCoverage);
        const valueFormat1 = view.uint16();
        const valueFormat2 = view.uint16();
        const cd1 = view.next(Ptr16ClassDef, context.gOrd);
        const cd2 = view.next(Ptr16ClassDef, context.gOrd);
        const class1Count = view.uint16();
        const class2Count = view.uint16();

        for (const gid of cov) ClassDefUtil.padClass0(cd1, context.gOrd.at(gid));
        for (const g of context.gOrd) ClassDefUtil.padClass0(cd2, g);
        for (let c1 = 0; c1 < class1Count; c1++) {
            const gs1 = new Set(ClassDefUtil.GlyphMatchingClass(cd1, c1));
            for (let c2 = 0; c2 < class2Count; c2++) {
                const gs2 = new Set(ClassDefUtil.GlyphMatchingClass(cd2, c2));
                const value1 = view.next(GposAdjustment, valueFormat1, context.ivs);
                const value2 = view.next(GposAdjustment, valueFormat2, context.ivs);
                lookup.adjustments.setIfAbsent(gs1, gs2, [value1, value2]);
            }
        }
    }
};

export class GposPairReader implements LookupReader<GsubGpos.Lookup, Gpos.Pair> {
    public createLookup() {
        return new Gpos.Pair();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.Pair,
        context: SubtableReadingContext<GsubGpos.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, context);
                break;
            case 2:
                view.next(SubtableFormat2, lookup, context);
                break;
            default:
                throw Errors.FormatNotSupported(`PairPos`, format);
        }
    }
}
