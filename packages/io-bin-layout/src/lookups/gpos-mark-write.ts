import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupWriter,
    SubtableSizeLimit,
    SubtableWriteContext
} from "../gsub-gpos-shared/general";
import { CovAuxMappingT, CovUtils, MaxCovItemWords, Ptr16GidCoverage } from "../shared/coverage";
import { GposAnchor, NullablePtr16GposAnchor, Ptr16GposAnchor } from "../shared/gpos-anchor";

type SingleMarkRecord<G> = {
    glyph: G;
    class: number;
    anchor: Gpos.Anchor;
};
type MarkClassRelocation = {
    forward: number[];
    reward: number[];
};

const MarkArray = {
    write(
        frag: Frag,
        axm: CovAuxMappingT<SingleMarkRecord<OtGlyph>>,
        relocation: MarkClassRelocation,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        frag.uint16(axm.length); // markCount
        for (const [gid, smr] of axm) {
            frag.uint16(relocation.forward[smr.class]) // markClass
                .push(Ptr16GposAnchor, smr.anchor, ctx.ivs); // markAnchorOffset
        }
    }
};

function getBaseAnchor(
    clsSubtable: number,
    record: Gpos.BaseRecord,
    relocation: MarkClassRelocation
) {
    return record.baseAnchors[relocation.reward[clsSubtable]];
}

const BaseArray = {
    write(
        frag: Frag,
        axm: CovAuxMappingT<Gpos.BaseRecord>,
        relocation: MarkClassRelocation,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        frag.uint16(axm.length);
        for (const [gid, br] of axm) {
            for (let mc = 0; mc < relocation.reward.length; mc++) {
                const anchor = br.baseAnchors[relocation.reward[mc]];
                frag.push(NullablePtr16GposAnchor, anchor, ctx.ivs);
            }
        }
    }
};

function getLigatureAnchor(
    clsSubtable: number,
    component: number,
    record: Gpos.LigatureBaseRecord,
    relocation: MarkClassRelocation
) {
    return (record.baseAnchors[component] || [])[relocation.reward[clsSubtable]];
}

const LigatureArray = {
    write(
        frag: Frag,
        axm: CovAuxMappingT<Gpos.LigatureBaseRecord>,
        relocation: MarkClassRelocation,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        frag.uint16(axm.length);
        for (const [gid, br] of axm) {
            const fLigatureAttach = frag.ptr16New();
            fLigatureAttach.uint16(br.baseAnchors.length);
            for (let component = 0; component < br.baseAnchors.length; component++) {
                for (let mc = 0; mc < relocation.reward.length; mc++) {
                    const anchor = getLigatureAnchor(mc, component, br, relocation);
                    fLigatureAttach.push(NullablePtr16GposAnchor, anchor, ctx.ivs);
                }
            }
        }
    }
};

interface MarkPlanClass<G, B> {
    new (marks: SingleMarkRecord<G>[], exclude: Set<G>, bases: Map<G, B>): MarkWritePlan<G, B>;
}
abstract class MarkWritePlan<G, B> {
    protected readonly relocation: MarkClassRelocation;
    constructor(
        public readonly marks: SingleMarkRecord<G>[],
        public readonly exclude: Set<G>,
        public readonly bases: Map<G, B>
    ) {
        this.relocation = this.getMarkPlanRelocation(marks);
    }

    public abstract measure(): number;
    protected abstract sub(
        marks: SingleMarkRecord<G>[],
        exclude: Set<G>,
        bases: Map<G, B>
    ): MarkWritePlan<G, B>;
    public abstract write(frag: Frag, ctx: SubtableWriteContext<Gpos.Lookup>): void;

    public isEmpty() {
        return !this.marks.length || !this.bases.size;
    }

    private getMarkPlanRelocation(plan: SingleMarkRecord<G>[]): MarkClassRelocation {
        const hasCls: number[] = [];
        for (const record of plan) {
            hasCls[record.class] = (hasCls[record.class] || 0) + 1;
        }
        let newCls = 0;
        const relocation: number[] = [];
        const revRelocation: number[] = [];
        for (let cls = 0; cls < hasCls.length; cls++) {
            if (hasCls[cls]) {
                relocation[cls] = newCls;
                revRelocation[newCls] = cls;
                newCls++;
            } else {
                relocation[cls] = -1;
            }
        }
        return { forward: relocation, reward: revRelocation };
    }

    public autoBisect(limit: number, d = 0): MarkWritePlan<G, B>[] {
        if (this.measure() < limit) {
            return [this];
        } else {
            const [lower, upper] = this.bisect();
            return [...lower.autoBisect(limit, d + 1), ...upper.autoBisect(limit, d + 1)];
        }
    }

    protected bisect() {
        let planMark: null | [MarkWritePlan<G, B>, MarkWritePlan<G, B>] = null;
        if (this.marks.length > 1) planMark = this.bisectImplByMarks();
        const planBase = this.bisectImplByBases();
        if (
            planMark &&
            planMark[0].measure() + planMark[1].measure() <
                planBase[0].measure() + planBase[1].measure()
        ) {
            return planMark;
        } else {
            return planBase;
        }
    }

    protected bisectImplByMarks(): [MarkWritePlan<G, B>, MarkWritePlan<G, B>] {
        const n = Math.floor(this.marks.length / 2);
        return [
            this.sub(this.marks.slice(0, n), this.exclude, this.bases),
            this.sub(this.marks.slice(n), this.exclude, this.bases)
        ];
    }

    protected bisectImplByBases(): [MarkWritePlan<G, B>, MarkWritePlan<G, B>] {
        const excludeLower: Set<G> = new Set(),
            excludeUpper: Set<G> = new Set();
        let nth = 0;
        for (const [g, br] of this.bases) {
            if (this.exclude.has(g)) {
                excludeLower.add(g);
                excludeUpper.add(g);
            } else {
                if (nth * 2 < this.bases.size) {
                    excludeUpper.add(g);
                } else {
                    excludeLower.add(g);
                }
                nth++;
            }
        }
        return [
            this.sub(this.marks, excludeLower, this.bases),
            this.sub(this.marks, excludeUpper, this.bases)
        ];
    }

    protected getMarkAxm(gOrd: Data.Order<G>) {
        return CovUtils.auxMapFromExtractor(this.marks, gOrd, r => r.glyph);
    }
}

class MarkBaseWritePlan extends MarkWritePlan<OtGlyph, Gpos.BaseRecord> {
    public measure() {
        let size = UInt16.size * 8;
        for (const rec of this.marks) {
            size +=
                UInt16.size * (2 + MaxCovItemWords) + // 1 cov item + 1 mark class id + 1 ptr
                GposAnchor.measure(rec.anchor);
        }
        for (const [g, br] of this.bases) {
            if (this.exclude.has(g)) continue;
            size += UInt16.size * (MaxCovItemWords + this.relocation.reward.length); // cov + ptr arr
            for (let clsAnchor = 0; clsAnchor < this.relocation.reward.length; clsAnchor++) {
                size += GposAnchor.measure(getBaseAnchor(clsAnchor, br, this.relocation));
            }
        }
        return size;
    }
    protected sub(
        marks: SingleMarkRecord<OtGlyph>[],
        exclude: Set<OtGlyph>,
        bases: Map<OtGlyph, Gpos.BaseRecord>
    ) {
        return new MarkBaseWritePlan(marks, exclude, bases);
    }
    public write(frag: Frag, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const axmMarks = this.getMarkAxm(ctx.gOrd);
        const axmBases = CovUtils.auxMapFromMapExcl(this.bases, ctx.gOrd, this.exclude);

        frag.uint16(1)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmMarks), ctx.trick)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmBases), ctx.trick)
            .uint16(this.relocation.reward.length)
            .ptr16(Frag.from(MarkArray, axmMarks, this.relocation, ctx))
            .ptr16(Frag.from(BaseArray, axmBases, this.relocation, ctx));
    }
}

class MarkLigatureWritePlan extends MarkWritePlan<OtGlyph, Gpos.LigatureBaseRecord> {
    public measure() {
        let size = UInt16.size * 8;
        for (const rec of this.marks) {
            size += UInt16.size * (2 + MaxCovItemWords) + GposAnchor.measure(rec.anchor);
        }
        for (const [g, br] of this.bases) {
            if (this.exclude.has(g)) continue;
            size +=
                UInt16.size *
                (2 +
                    MaxCovItemWords + //1 cov + 1 ptr + 1 component count
                    br.baseAnchors.length * this.relocation.reward.length);
            for (let component = 0; component < br.baseAnchors.length; component++) {
                for (let clsAnchor = 0; clsAnchor < this.relocation.reward.length; clsAnchor++) {
                    size += GposAnchor.measure(
                        getLigatureAnchor(clsAnchor, component, br, this.relocation)
                    );
                }
            }
        }
        return size;
    }
    protected sub(
        marks: SingleMarkRecord<OtGlyph>[],
        exclude: Set<OtGlyph>,
        bases: Map<OtGlyph, Gpos.LigatureBaseRecord>
    ) {
        return new MarkLigatureWritePlan(marks, exclude, bases);
    }
    public write(frag: Frag, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const axmMarks = this.getMarkAxm(ctx.gOrd);
        const axmBases = CovUtils.auxMapFromMapExcl(this.bases, ctx.gOrd, this.exclude);

        frag.uint16(1)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmMarks), ctx.trick)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmBases), ctx.trick)
            .uint16(this.relocation.reward.length)
            .ptr16(Frag.from(MarkArray, axmMarks, this.relocation, ctx))
            .ptr16(Frag.from(LigatureArray, axmBases, this.relocation, ctx));
    }
}

abstract class GposMarkToBaseWriterBase<G, B> {
    protected abstract baseCoversMarkClass(mc: number, base: B): boolean;

    protected createSubtableFragmentsImpl(
        cls: MarkPlanClass<G, B>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const frags: Frag[] = [];
        for (const stpStart of this.getInitialPlans(cls, marks, bases)) {
            const stPlans = stpStart.autoBisect(SubtableSizeLimit);
            for (const stp of stPlans) {
                if (stp.isEmpty()) continue;
                frags.push(Frag.from(stp, ctx));
            }
        }
        return frags;
    }

    private *getInitialPlans(
        cls: MarkPlanClass<G, B>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>
    ): IterableIterator<MarkWritePlan<G, B>> {
        const maxCls = this.getMaxAnchorClass(marks);
        const clsSetAdded = new Set<number>();

        for (;;) {
            const plan = this.fetchValidPlan(cls, marks, bases, maxCls, clsSetAdded);
            if (plan) yield plan;
            else break;
        }
    }

    private getMaxAnchorClass(marks: Map<G, Gpos.MarkRecord>) {
        let mc = 0;
        for (const [g, ma] of marks) {
            for (let cls = 0; cls < ma.markAnchors.length; cls++) {
                if (ma.markAnchors[cls] && cls + 1 > mc) mc = cls + 1;
            }
        }
        return mc;
    }

    private fetchValidPlan(
        cls: MarkPlanClass<G, B>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>,
        maxCls: number,
        clsSetAdded: Set<number>
    ) {
        let firstClass = true;
        const planBases = new Map<G, B>();
        const planMarks = new Map<G, SingleMarkRecord<G>>();

        loopCls: for (let c = 0; c < maxCls; c++) {
            if (clsSetAdded.has(c)) continue;

            let conflict = false;
            const currentClassMarks = new Map<G, SingleMarkRecord<G>>();

            // Process mark list: ensure this class doesn't conflict with existing marks
            for (const [g, ma] of marks) {
                const anchor = ma.markAnchors[c];
                if (!anchor) continue;
                currentClassMarks.set(g, { glyph: g, class: c, anchor });
                if (planMarks.has(g)) conflict = true;
            }
            if (conflict) continue loopCls;

            // Ensure the base array is a rectangular matrix
            if (firstClass) {
                firstClass = false;
                for (const [g, br] of bases) {
                    if (this.baseCoversMarkClass(c, br)) planBases.set(g, br);
                }
            } else {
                for (const [g, br] of bases) {
                    if (planBases.has(g) !== this.baseCoversMarkClass(c, br)) continue loopCls;
                }
            }

            // Copy
            for (const [g, mr] of currentClassMarks) planMarks.set(g, mr);
            clsSetAdded.add(c);
        }

        if (planMarks.size && planBases.size) {
            return new cls(Array.from(planMarks.values()), new Set(), planBases);
        } else {
            return null;
        }
    }
}

export class GposMarkToBaseWriter
    extends GposMarkToBaseWriterBase<OtGlyph, Gpos.BaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToBase> {
    protected baseCoversMarkClass(mc: number, br: Gpos.BaseRecord) {
        return br && !!br.baseAnchors[mc];
    }
    public canBeUsed(l: Gpos.Lookup): l is Gpos.MarkToBase {
        return l.type === Gpos.LookupType.MarkToBase;
    }
    public getLookupType() {
        return 4;
    }
    public getLookupTypeSymbol() {
        return Gpos.LookupType.MarkToBase;
    }
    public createSubtableFragments(
        lookup: Gpos.MarkToBase,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        return this.createSubtableFragmentsImpl(
            MarkBaseWritePlan,
            lookup.marks,
            lookup.bases,
            ctx
        );
    }
}
export class GposMarkToLigatureWriter
    extends GposMarkToBaseWriterBase<OtGlyph, Gpos.LigatureBaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToLigature> {
    protected baseCoversMarkClass(mc: number, br: Gpos.LigatureBaseRecord) {
        for (const component of br.baseAnchors) if (component[mc]) return true;
        return false;
    }
    public canBeUsed(l: Gpos.Lookup): l is Gpos.MarkToLigature {
        return l.type === Gpos.LookupType.MarkToLigature;
    }
    public getLookupType() {
        return 5;
    }
    public getLookupTypeSymbol() {
        return Gpos.LookupType.MarkToLigature;
    }
    public createSubtableFragments(
        lookup: Gpos.MarkToLigature,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        return this.createSubtableFragmentsImpl(
            MarkLigatureWritePlan,
            lookup.marks,
            lookup.bases,
            ctx
        );
    }
}
export class GposMarkToMarkWriter
    extends GposMarkToBaseWriterBase<OtGlyph, Gpos.BaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToMark> {
    protected baseCoversMarkClass(mc: number, br: Gpos.BaseRecord) {
        return br && !!br.baseAnchors[mc];
    }
    public canBeUsed(l: Gpos.Lookup): l is Gpos.MarkToMark {
        return l.type === Gpos.LookupType.MarkToMark;
    }
    public getLookupType() {
        return 6;
    }
    public getLookupTypeSymbol() {
        return Gpos.LookupType.MarkToMark;
    }
    public createSubtableFragments(
        lookup: Gpos.MarkToMark,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        return this.createSubtableFragmentsImpl(
            MarkBaseWritePlan,
            lookup.marks,
            lookup.baseMarks,
            ctx
        );
    }
}
