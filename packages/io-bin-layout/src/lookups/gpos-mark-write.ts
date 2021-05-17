import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";
import { WriteTimeIVS } from "@ot-builder/var-store";

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
    new (marks: SingleMarkRecord<G>[], bases: Map<G, B>): MarkWritePlan<G, B>;
    baseCoversMarkClass(mc: number, base: B): boolean;
}
abstract class MarkWritePlan<G, B> {
    protected readonly relocation: MarkClassRelocation;
    public readonly bases: Map<G, B>;
    constructor(public readonly marks: SingleMarkRecord<G>[], rawBases: Map<G, B>) {
        this.relocation = this.getMarkPlanRelocation(marks);
        this.bases = new Map();
        for (const [g, br] of rawBases) {
            if (this.baseIsSubstantial(br)) this.bases.set(g, br);
        }
    }

    public abstract measure(ivs: Data.Maybe<WriteTimeIVS>): number;
    protected abstract baseIsSubstantial(base: B): boolean;
    protected abstract sub(marks: SingleMarkRecord<G>[], bases: Map<G, B>): MarkWritePlan<G, B>;
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

    public autoBisect(ivs: Data.Maybe<WriteTimeIVS>, limit: number, d = 0): MarkWritePlan<G, B>[] {
        if (this.measure(ivs) < limit) {
            return [this];
        } else {
            const plan = this.bisect(ivs);
            if (!plan) return [this];
            const [lower, upper] = plan;
            return [
                ...lower.autoBisect(ivs, limit, d + 1),
                ...upper.autoBisect(ivs, limit, d + 1)
            ];
        }
    }

    protected bisect(ivs: Data.Maybe<WriteTimeIVS>) {
        let planMark: null | [MarkWritePlan<G, B>, MarkWritePlan<G, B>] = null;
        let planBase: null | [MarkWritePlan<G, B>, MarkWritePlan<G, B>] = null;
        if (this.marks.length > 1) planMark = this.bisectImplByMarks();
        if (this.bases.size > 1) planBase = this.bisectImplByBases();
        if (!planBase) return planMark;
        if (
            planMark &&
            planMark[0].measure(ivs) + planMark[1].measure(ivs) <
                planBase[0].measure(ivs) + planBase[1].measure(ivs)
        ) {
            return planMark;
        } else {
            return planBase;
        }
    }

    protected bisectImplByMarks(): [MarkWritePlan<G, B>, MarkWritePlan<G, B>] {
        const n = Math.floor(this.marks.length / 2);
        return [
            this.sub(this.marks.slice(0, n), this.bases),
            this.sub(this.marks.slice(n), this.bases)
        ];
    }

    protected bisectImplByBases(): [MarkWritePlan<G, B>, MarkWritePlan<G, B>] {
        const basesLower = new Map<G, B>(),
            basesUpper = new Map<G, B>();
        let nth = 0;
        for (const [g, br] of this.bases) {
            if (nth * 2 < this.bases.size) {
                basesLower.set(g, br);
            } else {
                basesUpper.set(g, br);
            }
            nth++;
        }
        return [this.sub(this.marks, basesLower), this.sub(this.marks, basesUpper)];
    }

    protected getMarkAxm(gOrd: Data.Order<G>) {
        return CovUtils.auxMapFromExtractor(this.marks, gOrd, r => r.glyph);
    }
}

class MarkBaseWritePlan extends MarkWritePlan<OtGlyph, Gpos.BaseRecord> {
    protected baseIsSubstantial(br: Gpos.BaseRecord) {
        for (const bc of this.relocation.reward)
            if (MarkBaseWritePlan.baseCoversMarkClass(bc, br)) return true;
        return false;
    }
    public measure(ivs: Data.Maybe<WriteTimeIVS>) {
        const anchorSet = new Set<string>();
        let size = UInt16.size * 8;
        for (const rec of this.marks) {
            size +=
                UInt16.size * (2 + MaxCovItemWords) + // 1 cov item + 1 mark class id + 1 ptr
                GposAnchor.hashMeasure(anchorSet, ivs, rec.anchor);
        }
        for (const [g, br] of this.bases) {
            size += UInt16.size * (MaxCovItemWords + this.relocation.reward.length); // cov + ptr arr
            for (let clsAnchor = 0; clsAnchor < this.relocation.reward.length; clsAnchor++) {
                const anchor = getBaseAnchor(clsAnchor, br, this.relocation);
                size += GposAnchor.hashMeasure(anchorSet, ivs, anchor);
            }
        }
        return size;
    }
    protected sub(marks: SingleMarkRecord<OtGlyph>[], bases: Map<OtGlyph, Gpos.BaseRecord>) {
        return new MarkBaseWritePlan(marks, bases);
    }
    public write(frag: Frag, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const axmMarks = this.getMarkAxm(ctx.gOrd);
        const axmBases = CovUtils.auxMapFromMap(this.bases, ctx.gOrd);

        frag.uint16(1)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmMarks), ctx.trick)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmBases), ctx.trick)
            .uint16(this.relocation.reward.length)
            .ptr16(Frag.from(MarkArray, axmMarks, this.relocation, ctx))
            .ptr16(Frag.from(BaseArray, axmBases, this.relocation, ctx));
    }

    public static baseCoversMarkClass(mc: number, br: Gpos.BaseRecord) {
        return br && !!br.baseAnchors[mc];
    }
}

class MarkLigatureWritePlan extends MarkWritePlan<OtGlyph, Gpos.LigatureBaseRecord> {
    protected baseIsSubstantial(br: Gpos.LigatureBaseRecord) {
        for (const bc of this.relocation.reward) {
            if (MarkLigatureWritePlan.baseCoversMarkClass(bc, br)) return true;
        }
        return false;
    }
    public measure(ivs: Data.Maybe<WriteTimeIVS>) {
        const anchorSet = new Set<string>();
        let size = UInt16.size * 8;
        for (const rec of this.marks) {
            size +=
                UInt16.size * (2 + MaxCovItemWords) +
                GposAnchor.hashMeasure(anchorSet, ivs, rec.anchor);
        }
        for (const [g, br] of this.bases) {
            size +=
                UInt16.size *
                (2 +
                    MaxCovItemWords + //1 cov + 1 ptr + 1 component count
                    br.baseAnchors.length * this.relocation.reward.length);
            for (let component = 0; component < br.baseAnchors.length; component++) {
                for (let clsAnchor = 0; clsAnchor < this.relocation.reward.length; clsAnchor++) {
                    const anchor = getLigatureAnchor(clsAnchor, component, br, this.relocation);
                    size += GposAnchor.hashMeasure(anchorSet, ivs, anchor);
                }
            }
        }
        return size;
    }
    protected sub(
        marks: SingleMarkRecord<OtGlyph>[],
        bases: Map<OtGlyph, Gpos.LigatureBaseRecord>
    ) {
        return new MarkLigatureWritePlan(marks, bases);
    }
    public write(frag: Frag, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const axmMarks = this.getMarkAxm(ctx.gOrd);
        const axmBases = CovUtils.auxMapFromMap(this.bases, ctx.gOrd);

        frag.uint16(1)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmMarks), ctx.trick)
            .push(Ptr16GidCoverage, CovUtils.gidListFromAuxMap(axmBases), ctx.trick)
            .uint16(this.relocation.reward.length)
            .ptr16(Frag.from(MarkArray, axmMarks, this.relocation, ctx))
            .ptr16(Frag.from(LigatureArray, axmBases, this.relocation, ctx));
    }

    public static baseCoversMarkClass(mc: number, br: Gpos.LigatureBaseRecord) {
        for (const component of br.baseAnchors) if (component[mc]) return true;
        return false;
    }
}

abstract class GposMarkWriterBase<G, B> {
    protected createSubtableFragmentsImpl(
        cls: MarkPlanClass<G, B>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const frags: Frag[] = [];
        for (const stpStart of this.getInitialPlans(cls, marks, bases)) {
            const stPlans = stpStart.autoBisect(ctx.ivs, SubtableSizeLimit);
            for (const stp of stPlans) {
                if (stp.isEmpty()) continue;
                frags.push(Frag.from(stp, ctx));
            }
        }
        return frags;
    }

    private getInitialPlans(
        cls: MarkPlanClass<G, B>,
        marks: Map<G, Gpos.MarkRecord>,
        bases: Map<G, B>
    ) {
        const maxCls = this.getMaxAnchorClass(marks);
        const clsSetAdded = new Set<number>();
        const plans: MarkWritePlan<G, B>[] = [];

        for (;;) {
            const plan = this.fetchValidPlan(cls, marks, bases, maxCls, clsSetAdded);
            if (plan) plans.push(plan);
            else break;
        }
        return plans;
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
            if (conflict) break loopCls;

            // Ensure the base array is a rectangular matrix
            if (firstClass) {
                firstClass = false;
                for (const [g, br] of bases) {
                    if (cls.baseCoversMarkClass(c, br)) planBases.set(g, br);
                }
            } else {
                for (const [g, br] of bases) {
                    if (planBases.has(g) !== cls.baseCoversMarkClass(c, br)) break loopCls;
                }
            }

            // Copy
            for (const [g, mr] of currentClassMarks) planMarks.set(g, mr);
            clsSetAdded.add(c);
        }

        if (planMarks.size && planBases.size) {
            return new cls(Array.from(planMarks.values()), planBases);
        } else {
            return null;
        }
    }
}

export class GposMarkToBaseWriter
    extends GposMarkWriterBase<OtGlyph, Gpos.BaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToBase>
{
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
    extends GposMarkWriterBase<OtGlyph, Gpos.LigatureBaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToLigature>
{
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
    extends GposMarkWriterBase<OtGlyph, Gpos.BaseRecord>
    implements LookupWriter<Gpos.Lookup, Gpos.MarkToMark>
{
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
