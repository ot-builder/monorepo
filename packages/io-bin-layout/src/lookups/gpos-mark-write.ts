import { Writable } from "stream";

import { Frag, Write } from "@ot-builder/bin-util";
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

interface MarkPlanClass<G, B, R> {
    new (marks: SingleMarkRecord<G>[], exclude: Set<G>, bases: Map<G, B>): R;
}
abstract class MarkWritePlanBase<G, B, R> {
    public readonly bases: Map<G, B>;
    protected readonly relocation: MarkClassRelocation;
    constructor(
        public readonly marks: SingleMarkRecord<G>[],
        public readonly exclude: Set<G>,
        rawBases: Map<G, B>
    ) {
        this.relocation = this.getMarkPlanRelocation(marks);
        this.bases = new Map();
        for (const [g, br] of rawBases) {
            if (!this.exclude.has(g) && this.baseIsSubstantial(br)) this.bases.set(g, br);
        }
    }

    protected abstract baseIsSubstantial(base: B): boolean;
    public abstract autoBisect(limit: number): R[];
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

    protected bisectImplByMarks<R>(cls: MarkPlanClass<G, B, R>): [R, R] {
        const n = Math.floor(this.marks.length / 2);
        return [
            new cls(this.marks.slice(0, n), this.exclude, this.bases),
            new cls(this.marks.slice(n), this.exclude, this.bases)
        ];
    }

    protected bisectImplByBases<R>(cls: MarkPlanClass<G, B, R>): [R, R] {
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
            new cls(this.marks, excludeLower, this.bases),
            new cls(this.marks, excludeUpper, this.bases)
        ];
    }

    protected getMarkAxm(gOrd: Data.Order<G>) {
        return CovUtils.auxMapFromExtractor(this.marks, gOrd, r => r.glyph);
    }
}

class MarkBaseWritePlan extends MarkWritePlanBase<OtGlyph, Gpos.BaseRecord, MarkBaseWritePlan> {
    protected baseIsSubstantial(br: Gpos.BaseRecord) {
        for (const bc of this.relocation.reward) if (br.baseAnchors[bc]) return true;
        return false;
    }

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
    public bisect() {
        let planMark: null | [MarkBaseWritePlan, MarkBaseWritePlan] = null;
        if (this.marks.length > 1) planMark = this.bisectImplByMarks(MarkBaseWritePlan);
        const planBase = this.bisectImplByBases(MarkBaseWritePlan);
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
    public autoBisect(limit: number, d = 0): MarkBaseWritePlan[] {
        if (this.measure() < limit) {
            return [this];
        } else {
            const [lower, upper] = this.bisect();
            return [...lower.autoBisect(limit, d + 1), ...upper.autoBisect(limit, d + 1)];
        }
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

class MarkLigatureWritePlan extends MarkWritePlanBase<
    OtGlyph,
    Gpos.LigatureBaseRecord,
    MarkLigatureWritePlan
> {
    protected baseIsSubstantial(br: Gpos.LigatureBaseRecord) {
        for (const bc of this.relocation.reward) {
            for (const component of br.baseAnchors) {
                if (component && component[bc]) return true;
            }
        }
        return false;
    }

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
    public bisect() {
        let planMark: null | [MarkLigatureWritePlan, MarkLigatureWritePlan] = null;
        if (this.marks.length > 1) planMark = this.bisectImplByMarks(MarkLigatureWritePlan);
        const planBase = this.bisectImplByBases(MarkLigatureWritePlan);
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
    public autoBisect(limit: number): MarkLigatureWritePlan[] {
        if (this.measure() < limit) return [this];
        else {
            const [lower, upper] = this.bisect();
            return [...lower.autoBisect(limit), ...upper.autoBisect(limit)];
        }
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

class GposMarkToBaseWriterBase {
    private getMarkPlans<G>(marks: Map<G, Gpos.MarkRecord>) {
        const covMap: Map<G, number> = new Map();
        let collected = 0;
        const plans: SingleMarkRecord<G>[][] = [];

        do {
            collected = 0;
            const plan: SingleMarkRecord<G>[] = [];
            for (const [g, ma] of marks) {
                const clsStart = covMap.get(g) || 0;
                for (let clsMark = clsStart; clsMark < ma.markAnchors.length; clsMark++) {
                    const anchor = ma.markAnchors[clsMark];
                    if (!anchor) continue;
                    plan.push({ glyph: g, class: clsMark, anchor });
                    covMap.set(g, clsMark + 1);
                    collected += 1;
                    break;
                }
            }
            if (plan.length) plans.push(plan);
        } while (collected > 0);

        return plans;
    }

    protected createSubtableFragmentsImpl<G, B, R extends MarkWritePlanBase<G, B, R>>(
        cls: MarkPlanClass<G, B, R>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const markPlans = this.getMarkPlans(marks);
        const frags: Frag[] = [];
        for (const mp of markPlans) {
            const stpStart = new cls(mp, new Set(), bases);
            const stPlans = stpStart.autoBisect(SubtableSizeLimit);
            for (const stp of stPlans) {
                if (stp.isEmpty()) continue;
                frags.push(Frag.from(stp, ctx));
            }
        }
        return frags;
    }
}

export class GposMarkToBaseWriter
    extends GposMarkToBaseWriterBase
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToBase> {
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
    extends GposMarkToBaseWriterBase
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToLigature> {
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
    extends GposMarkToBaseWriterBase
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToMark> {
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
