import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Gsub } from "@ot-builder/ft-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableWriteContext
} from "../gsub-gpos-shared/general";
import { CovUtils, Ptr16GidCoverage } from "../shared/coverage";

import { SimpleCoverageArray } from "./shared-types";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gsub.ReverseSub, ctx: SubtableReadingContext<Gsub.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`ReverseChainSingleSubstFormat1`, format, 1);

        const covInput = view.next(Ptr16GidCoverage);
        const gsInput = CovUtils.glyphSetFromGidList(covInput, ctx.gOrd);
        const gssBacktrack = view.next(SimpleCoverageArray, ctx.gOrd).reverse();
        const gssLookAhead = view.next(SimpleCoverageArray, ctx.gOrd);

        const rule: Gsub.ReverseRule = {
            match: [...gssBacktrack, gsInput, ...gssLookAhead],
            doSubAt: gssBacktrack.length,
            replacement: new Map()
        };

        const glyphCount = view.uint16();
        Assert.SizeMatch(
            `ReverseChainSingleSubstFormat1::glyphCount`,
            glyphCount,
            covInput.length
        );

        for (const from of covInput) {
            rule.replacement.set(ctx.gOrd.at(from), ctx.gOrd.at(view.uint16()));
        }

        lookup.rules.push(rule);
    },
    write(frag: Frag, rule: Gsub.ReverseRule, ctx: SubtableWriteContext<Gsub.Lookup>) {
        let gm: [number, number][] = [];
        for (const input of rule.match[rule.doSubAt]) {
            gm.push([
                ctx.gOrd.reverse(input),
                ctx.gOrd.reverse(rule.replacement.get(input) || input)
            ]);
        }
        gm = CovUtils.sortAuxMap(gm);

        frag.uint16(1)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(gm))
            .push(SimpleCoverageArray, rule.match.slice(0, rule.doSubAt), ctx.gOrd)
            .push(SimpleCoverageArray, rule.match.slice(rule.doSubAt + 1), ctx.gOrd)
            .uint16(gm.length)
            .array(UInt16, CovUtils.valueListFromAuxMap(gm));
    }
};

export class GsubReverseReader implements LookupReader<Gsub.Lookup, Gsub.ReverseSub> {
    public createLookup() {
        return Gsub.ReverseSub.create();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gsub.ReverseSub,
        ctx: SubtableReadingContext<Gsub.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, ctx);
                break;
            default:
                throw Errors.FormatNotSupported(`chaining subtable`, format);
        }
    }
}

export class GsubReverseWriter implements LookupWriter<Gsub.Lookup, Gsub.ReverseSub> {
    public canBeUsed(l: Gsub.Lookup): l is Gsub.ReverseSub {
        return l.type === Gsub.LookupType.GsubReverse;
    }
    public getLookupType() {
        return 8;
    }
    public createSubtableFragments(
        lookup: Gsub.ReverseSub,
        ctx: SubtableWriteContext<Gsub.Lookup>
    ) {
        let frags: Frag[] = [];
        for (const rule of lookup.rules) {
            ctx.stat.setContext(rule.match.length);
            frags.push(Frag.from(SubtableFormat1, rule, ctx));
        }
        return frags;
    }
}
