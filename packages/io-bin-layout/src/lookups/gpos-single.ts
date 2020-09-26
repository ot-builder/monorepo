import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Gpos } from "@ot-builder/ot-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupReader,
    LookupWriter,
    SubtableReadingContext,
    SubtableSizeLimit,
    SubtableWriteContext,
    SubtableWriteTrick
} from "../gsub-gpos-shared/general";
import { CovUtils, GidCoverage, MaxCovItemWords, Ptr16GidCoverage } from "../shared/coverage";
import { GposAdjustment } from "../shared/gpos-adjust";

const SubtableFormat1 = {
    read(view: BinaryView, lookup: Gpos.Single, context: SubtableReadingContext<Gpos.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`SinglePosFormat1`, format, 1);
        const coverage = view.ptr16().next(GidCoverage);
        const valueFormat = view.uint16();
        const adj = view.next(GposAdjustment, valueFormat, context.ivs);
        for (const gid of coverage) {
            const gSource = context.gOrd.at(gid);
            if (lookup.adjustments.has(gSource)) continue;
            lookup.adjustments.set(gSource, adj);
        }
    },
    write(
        frag: Frag,
        adj: Gpos.Adjustment,
        data: number[],
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const fmt = GposAdjustment.decideFormat(adj);
        frag.uint16(1);
        frag.push(Ptr16GidCoverage, data, ctx.trick);
        frag.uint16(fmt);
        frag.push(GposAdjustment, adj, fmt, ctx.ivs);
    }
};

const SubtableFormat2 = {
    read(view: BinaryView, lookup: Gpos.Single, context: SubtableReadingContext<Gpos.Lookup>) {
        const format = view.uint16();
        Assert.FormatSupported(`SinglePosFormat2`, format, 2);

        const coverage = view.ptr16().next(GidCoverage);
        const valueFormat = view.uint16();
        const glyphCount = view.uint16();
        Assert.SizeMatch(`SinglePosFormat2::glyphCount`, coverage.length, glyphCount);

        for (const gid of coverage) {
            const adj = view.next(GposAdjustment, valueFormat, context.ivs);
            const gSource = context.gOrd.at(gid);
            if (lookup.adjustments.has(gSource)) continue;
            lookup.adjustments.set(gSource, adj);
        }
    },
    write(
        frag: Frag,
        data: [number, Gpos.Adjustment][],
        fmt: number,

        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        frag.uint16(2);
        frag.push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(data), ctx.trick);
        frag.uint16(fmt);
        frag.uint16(data.length);
        frag.array(GposAdjustment, CovUtils.valueListFromAuxMap(data), fmt, ctx.ivs);
    }
};

export class GposSingleReader implements LookupReader<Gpos.Lookup, Gpos.Single> {
    public createLookup() {
        return new Gpos.Single();
    }
    public parseSubtable(
        view: BinaryView,
        lookup: Gpos.Single,
        context: SubtableReadingContext<Gpos.Lookup>
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
                throw Errors.FormatNotSupported(`Single Positioning Subtable`, format);
        }
    }
}

class GsubSingleWriterState {
    public mappings: Map<string, [Gpos.Adjustment, number[]]> = new Map();
    public addRecord(gid: number, adj: Gpos.Adjustment, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const h = GposAdjustment.hash(adj, ctx.ivs);
        if (!h) return; // omit 0
        let a = this.mappings.get(h);
        if (!a) {
            a = [adj, []];
            this.mappings.set(h, a);
        }
        a[1].push(gid);
    }
    public collectJagged(singleSubtable: boolean) {
        const out: [number, Gpos.Adjustment][] = [];
        for (const [h, [adj, gids]] of this.mappings) {
            if (singleSubtable || gids.length < 8) {
                this.mappings.delete(h);
                for (const gid of gids) out.push([gid, adj]);
            }
        }
        return out;
    }
}

const MaxUniformItems = Math.floor(
    (SubtableSizeLimit - UInt16.size * 16) / (UInt16.size * MaxCovItemWords)
);

export class GposSingleWriter implements LookupWriter<Gpos.Lookup, Gpos.Single> {
    public canBeUsed(l: Gpos.Lookup): l is Gpos.Single {
        return l.type === Gpos.LookupType.Single;
    }
    public getLookupType() {
        return 1;
    }
    public getLookupTypeSymbol() {
        return Gpos.LookupType.Single;
    }
    private pickJaggedData(jagged: [number, Gpos.Adjustment][]) {
        let fmt = 0;
        for (const [gid, adj] of jagged) fmt |= GposAdjustment.decideFormat(adj);
        let size = UInt16.size * 4,
            picks = 0;
        for (const [gid, adj] of jagged) {
            const dSize = UInt16.size * MaxCovItemWords + GposAdjustment.measure(adj, fmt);
            if (size + dSize > SubtableSizeLimit) break;
            size += dSize;
            picks += 1;
        }

        const data = CovUtils.sortAuxMap([...jagged].slice(0, picks));
        return { fmt, data };
    }

    private buildJagged(
        frags: Frag[],
        jagged: [number, Gpos.Adjustment][],
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const { fmt, data } = this.pickJaggedData(jagged);
        frags.push(Frag.from(SubtableFormat2, data, fmt, ctx));
        return data.length;
    }

    private buildUniform(
        frags: Frag[],
        adj: Gpos.Adjustment,
        gids: number[],
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const data = CovUtils.sortGidList([...gids].slice(0, MaxUniformItems));
        frags.push(Frag.from(SubtableFormat1, adj, data, ctx));
        return data.length;
    }

    public createSubtableFragments(lookup: Gpos.Single, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const singleLookup = !!(ctx.trick & SubtableWriteTrick.AvoidBreakSubtable);
        const st = new GsubSingleWriterState();
        for (const [from, to] of lookup.adjustments) {
            st.addRecord(ctx.gOrd.reverse(from), to, ctx);
        }
        const frags: Frag[] = [];

        // jagged
        const jagged = st.collectJagged(singleLookup);
        while (jagged.length) {
            const len = this.buildJagged(frags, jagged, ctx);
            jagged.splice(0, len);
        }

        // flat
        for (const [gidDiff, [adj, gids]] of st.mappings) {
            if (gids && gids.length) {
                while (gids.length) {
                    const len = this.buildUniform(frags, adj, gids, ctx);
                    gids.splice(0, len);
                }
            }
        }

        return frags;
    }
}
