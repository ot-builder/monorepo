import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableSizeLimit,
    SubtableWriteContext
} from "../gsub-gpos-shared/general";
import { CovUtils, GidCoverage, Ptr16GidCoverage } from "../shared/coverage";
import { GposAnchor, NullablePtr16GposAnchor } from "../shared/gpos-anchor";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gpos.Cursive, context: SubtableReadingContext<Gpos.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`CursivePosFormat1`, format, 1);
        const coverage = view.ptr16().next(GidCoverage);
        const entryExitCount = view.uint16();
        Assert.SizeMatch(`CursivePosFormat1::entryExitCount`, entryExitCount, coverage.length);
        for (const gid of coverage) {
            const entry = view.next(NullablePtr16GposAnchor, context.ivs);
            const exit = view.next(NullablePtr16GposAnchor, context.ivs);
            lookup.attachments.set(context.gOrd.at(gid), { entry, exit });
        }
    },
    write(
        frag: Frag,
        mapping: Map<OtGlyph, Gpos.CursiveAnchorPair>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const { gidList, values } = CovUtils.splitListFromMap(mapping, ctx.gOrd);

        frag.uint16(1);
        frag.push(Ptr16GidCoverage, gidList);
        frag.uint16(values.length);
        for (const to of values) {
            frag.push(NullablePtr16GposAnchor, to.entry, ctx.ivs);
            frag.push(NullablePtr16GposAnchor, to.exit, ctx.ivs);
        }
    }
};

export class GposCursiveReader implements LookupReader<Gpos.Lookup, Gpos.Cursive> {
    public createLookup() {
        return new Gpos.Cursive();
    }

    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.Cursive,
        context: SubtableReadingContext<Gpos.Lookup>
    ) {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                view.next(SubtableFormat1, lookup, context);
                break;
            default:
                throw Errors.FormatNotSupported(`Single Positioning Subtable`, format);
        }
    }
}

class State {
    public mapping: Map<OtGlyph, Gpos.CursiveAnchorPair> = new Map();
    public size = UInt16.size * 3;

    public tryAddMapping(from: OtGlyph, to: Gpos.CursiveAnchorPair) {
        const deltaSize =
            UInt16.size * 3 + // 1 gid + 2 ptr
            GposAnchor.measure(to.entry) +
            GposAnchor.measure(to.exit);
        if (this.size + deltaSize > SubtableSizeLimit) return false;
        this.mapping.set(from, to);
        this.size += deltaSize;
        return true;
    }
}

export class GposCursiveWriter implements LookupWriter<Gpos.Lookup, Gpos.Cursive> {
    public canBeUsed(l: Gpos.Lookup): l is Gpos.Cursive {
        return l.type === Gpos.LookupType.Cursive;
    }
    public getLookupType() {
        return 3;
    }

    public flush(frags: Frag[], state: State, ctx: SubtableWriteContext<Gpos.Lookup>) {
        if (!state.mapping.size) return;
        frags.push(Frag.from(SubtableFormat1, state.mapping, ctx));
    }

    public createSubtableFragments(lookup: Gpos.Cursive, ctx: SubtableWriteContext<Gpos.Lookup>) {
        let state = new State();
        const frags: Frag[] = [];
        for (const [from, to] of lookup.attachments) {
            if (state.tryAddMapping(from, to)) continue;
            this.flush(frags, state, ctx);
            state = new State();
            if (!state.tryAddMapping(from, to)) throw Errors.Unreachable();
        }
        this.flush(frags, state, ctx);
        return frags;
    }
}
