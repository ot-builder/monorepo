import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Gpos, Gsub, GsubGpos } from "@ot-builder/ft-layout";
import { Data } from "@ot-builder/prelude";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupWriter,
    SubtableWriteContext,
    SubtableWriteTrick
} from "../gsub-gpos-shared/general";
import { Ptr16ClassDef } from "../shared/class-def";
import { Ptr16GlyphCoverage } from "../shared/coverage";

type CompatibleRuleResult<L> = {
    cdBacktrack: GsubGpos.ClassDef;
    cdInput: GsubGpos.ClassDef;
    cdLookAhead: GsubGpos.ClassDef;
    cr: GsubGpos.ChainingClassRule<{ ref: L }>;
    firstGlyphSet: Set<OtGlyph>;
    firstGlyphClass: number;
};

class ClassDefsAnalyzeState<L> {
    public firstGlyphSet: Set<OtGlyph> = new Set();
    public cdBacktrack: GsubGpos.ClassDef = new Map();
    public cdInput: GsubGpos.ClassDef = new Map();
    public cdLookAhead: GsubGpos.ClassDef = new Map();
    public rules: Array<GsubGpos.ChainingRule<{ ref: L }>> = [];
    public classRules: Map<number, Array<GsubGpos.ChainingClassRule<{ ref: L }>>> = new Map();
    public lastFirstClass: number = 0;
    public maxFirstClass: number = 0;
    public ruleComplexity: number = 0; // Quantity of UInt16s of ChainSubClassRule's

    private glyphSetCompatibleWithExistingClassDef(
        gs: Data.Maybe<Set<OtGlyph>>,
        cd: GsubGpos.ClassDef
    ) {
        if (!gs || !gs.size) return undefined;
        let firstClass: number | undefined = undefined;
        for (const g of gs) {
            const gk = cd.get(g);
            if (gk == null) return undefined;
            if (firstClass === undefined) firstClass = gk;
            else if (gk !== firstClass) return undefined;
        }
        if (firstClass == null) return undefined;
        for (const [g, cls] of cd) if (cls === firstClass && !gs.has(g)) return undefined;
        return firstClass;
    }

    private glyphSetCompatibleWithNewClassDef(
        gs: Data.Maybe<Set<OtGlyph>>,
        cd: GsubGpos.ClassDef
    ) {
        if (!gs || !gs.size) return undefined;
        for (const g of gs) {
            const gk = cd.get(g);
            if (gk != null) return undefined;
        }
        let introClass = 0;
        for (const [g, cls] of cd) if (cls + 1 > introClass) introClass = cls + 1;
        return introClass;
    }

    private glyphSetCompatibleWithClassDef(gs: Data.Maybe<Set<OtGlyph>>, cd: GsubGpos.ClassDef) {
        const kExisting = this.glyphSetCompatibleWithExistingClassDef(gs, cd);
        if (kExisting != null) return kExisting;
        else return this.glyphSetCompatibleWithNewClassDef(gs, cd);
    }

    private checkRuleCompatibility(
        rule: GsubGpos.ChainingRule<{ ref: L }>
    ): null | CompatibleRuleResult<L> {
        const cdBacktrack = new Map(this.cdBacktrack);
        const cdInput = new Map(this.cdInput);
        const cdLookAhead = new Map(this.cdLookAhead);

        const cr: GsubGpos.ChainingClassRule<{ ref: L }> = {
            match: [],
            inputBegins: rule.inputBegins,
            inputEnds: rule.inputEnds,
            applications: rule.applications
        };

        const firstGlyphSet = rule.match[rule.inputBegins];
        const firstGlyphClass = this.glyphSetCompatibleWithClassDef(firstGlyphSet, cdInput);
        if (!firstGlyphClass || firstGlyphClass < this.lastFirstClass) return null;
        cr.match[cr.inputBegins] = firstGlyphClass;

        for (let matchId = 0; matchId < rule.match.length; matchId++) {
            if (matchId === rule.inputBegins) continue;
            const cd =
                matchId < rule.inputBegins
                    ? cdBacktrack
                    : matchId < rule.inputEnds
                    ? cdInput
                    : cdLookAhead;
            const kMatch = this.glyphSetCompatibleWithClassDef(rule.match[matchId], cd);
            if (!kMatch) return null;
            cr.match[matchId] = kMatch;
        }

        return {
            cdBacktrack,
            cdInput,
            cdLookAhead,
            cr,
            firstGlyphClass,
            firstGlyphSet
        };
    }

    private compatibleRuleComplexity(comp: CompatibleRuleResult<L>) {
        return 8 + comp.cr.match.length + 2 * comp.cr.applications.length;
    }

    private estimateUpdatedSubtableSize(comp: CompatibleRuleResult<L>) {
        return (
            UInt16.size *
            (8 +
                2 * (comp.cdBacktrack.size + comp.cdInput.size + comp.cdLookAhead.size) +
                this.ruleComplexity +
                this.compatibleRuleComplexity(comp))
        );
    }

    private addCompatibleRule(
        rule: GsubGpos.ChainingRule<{ ref: L }>,
        comp: CompatibleRuleResult<L>
    ) {
        this.cdBacktrack = comp.cdBacktrack;
        this.cdInput = comp.cdInput;
        this.cdLookAhead = comp.cdLookAhead;
        this.rules.push(rule);
        const a = this.classRules.get(comp.firstGlyphClass);
        if (a) a.push(comp.cr);
        else this.classRules.set(comp.firstGlyphClass, [comp.cr]);
        this.lastFirstClass = comp.firstGlyphClass;
        if (comp.firstGlyphClass > this.maxFirstClass) this.maxFirstClass = comp.firstGlyphClass;
        if (comp.firstGlyphSet) for (const g of comp.firstGlyphSet) this.firstGlyphSet.add(g);
        this.ruleComplexity += this.compatibleRuleComplexity(comp);
    }

    public tryAddRule(rule: GsubGpos.ChainingRule<{ ref: L }>) {
        const comp = this.checkRuleCompatibility(rule);
        if (!comp) return false;
        if (0x8000 < this.estimateUpdatedSubtableSize(comp)) return false;
        this.addCompatibleRule(rule, comp);
        return true;
    }
}

class CApplication<L> {
    public write(
        frag: Frag,
        apps: ReadonlyArray<GsubGpos.ChainingApplication<{ ref: L }>>,
        crossRef: Data.Order<L>
    ) {
        for (const app of apps) {
            frag.uint16(app.at).uint16(crossRef.reverse(app.apply.ref));
        }
    }
}

class CCoverageRule<L> {
    private rApplication = new CApplication<L>();
    public write(
        frag: Frag,
        isChaining: boolean,
        rule: GsubGpos.ChainingRule<{ ref: L }>,
        ctx: SubtableWriteContext<L>
    ) {
        frag.uint16(3);
        const backtrackSets = rule.match.slice(0, rule.inputBegins).reverse();
        const inputSets = rule.match.slice(rule.inputBegins, rule.inputEnds);
        const lookAheadSets = rule.match.slice(rule.inputEnds);
        if (isChaining) {
            frag.uint16(backtrackSets.length);
            for (const set of backtrackSets) frag.push(Ptr16GlyphCoverage, set, ctx.gOrd);
        }

        frag.uint16(inputSets.length);
        if (!isChaining) frag.uint16(rule.applications.length);
        for (const set of inputSets) frag.push(Ptr16GlyphCoverage, set, ctx.gOrd);

        if (isChaining) {
            frag.uint16(lookAheadSets.length);
            for (const set of lookAheadSets) frag.push(Ptr16GlyphCoverage, set, ctx.gOrd);

            frag.uint16(rule.applications.length);
        }
        frag.push(this.rApplication, rule.applications, ctx.crossReferences);
    }
}

class CClassRule<L> {
    private rApplication = new CApplication<L>();
    public write(
        frag: Frag,
        isChaining: boolean,
        cr: GsubGpos.ChainingClassRule<{ ref: L }>,
        ctx: SubtableWriteContext<L>
    ) {
        const backtrack = cr.match.slice(0, cr.inputBegins).reverse();
        const input = cr.match.slice(cr.inputBegins, cr.inputEnds);
        const lookAhead = cr.match.slice(cr.inputEnds);

        if (isChaining) {
            frag.uint16(backtrack.length);
            for (const c of backtrack) frag.uint16(c);
        }

        frag.uint16(input.length);
        if (!isChaining) frag.uint16(cr.applications.length);
        for (let iInput = 1; iInput < input.length; iInput++) frag.uint16(input[iInput]);

        if (isChaining) {
            frag.uint16(lookAhead.length);
            for (const c of lookAhead) frag.uint16(c);
            frag.uint16(cr.applications.length);
        }
        frag.push(this.rApplication, cr.applications, ctx.crossReferences);
    }
}

class CClassRuleSet<L> {
    private wClassRule = new CClassRule<L>();
    public write(
        frag: Frag,
        isChaining: boolean,
        s: ClassDefsAnalyzeState<L>,
        ctx: SubtableWriteContext<L>
    ) {
        frag.uint16(2);
        frag.push(Ptr16GlyphCoverage, s.firstGlyphSet, ctx.gOrd);
        if (isChaining) frag.push(Ptr16ClassDef, s.cdBacktrack, ctx.gOrd);
        frag.push(Ptr16ClassDef, s.cdInput, ctx.gOrd);
        if (isChaining) frag.push(Ptr16ClassDef, s.cdLookAhead, ctx.gOrd);
        frag.uint16(s.maxFirstClass + 1);
        for (let c = 0; c <= s.maxFirstClass; c++) {
            const a = s.classRules.get(c);
            if (!a || !a.length) {
                frag.ptr16(null);
            } else {
                const bRuleSet = frag.ptr16New();
                bRuleSet.uint16(a.length);
                for (const cr of a) {
                    bRuleSet.ptr16New().push(this.wClassRule, isChaining, cr, ctx);
                }
            }
        }
    }
}

abstract class ChainingContextualWriter<L, C extends L & GsubGpos.ChainingProp<{ ref: L }>>
    implements LookupWriter<L, C> {
    private wCoverageRule = new CCoverageRule<L>();
    private wClassRuleSet = new CClassRuleSet<L>();

    protected useChainingLookup(lookup: C) {
        let chain = false;
        for (const rule of lookup.rules) {
            if (rule.inputBegins > 0 || rule.inputEnds < rule.match.length) {
                chain = true;
            }
        }
        return chain;
    }
    public abstract getLookupType(lookup: C): number;

    public abstract canBeUsed(l: L): l is C;

    private covSubtable(
        rule: GsubGpos.ChainingRule<{ ref: L }>,
        isChaining: boolean,
        ctx: SubtableWriteContext<L>
    ) {
        return Frag.from(this.wCoverageRule, isChaining, rule, ctx);
    }

    private clsSubtable(
        s: ClassDefsAnalyzeState<L>,
        isChaining: boolean,
        ctx: SubtableWriteContext<L>
    ) {
        return Frag.from(this.wClassRuleSet, isChaining, s, ctx);
    }

    private flushState(
        isChaining: boolean,
        s: ClassDefsAnalyzeState<L>,
        results: Frag[],
        ctx: SubtableWriteContext<L>
    ) {
        if (!s.rules.length) return;
        const subtablesCov: Frag[] = [];
        let subtableCovSize: number = 0;
        for (const rule of s.rules) {
            const st = this.covSubtable(rule, isChaining, ctx);
            subtablesCov.push(st);
            subtableCovSize += UInt16.size + st.size;
        }

        const subtableClasses = this.clsSubtable(s, isChaining, ctx);
        if (this.shouldUseClassBasedSubtable(ctx, subtableClasses, subtableCovSize)) {
            results.push(subtableClasses);
        } else {
            for (const st of subtablesCov) results.push(st);
        }
    }

    private shouldUseClassBasedSubtable(
        ctx: SubtableWriteContext<L>,
        subtableClasses: Frag,
        subtableCovSize: number
    ) {
        return (
            ctx.trick & SubtableWriteTrick.ChainingForceFormat2 ||
            subtableClasses.size + UInt16.size <= subtableCovSize
        );
    }

    public createSubtableFragments(lookup: C, ctx: SubtableWriteContext<L>): Array<Frag> {
        const isChaining = this.useChainingLookup(lookup);
        const results: Frag[] = [];
        let state = new ClassDefsAnalyzeState<L>();
        for (const rule of lookup.rules) {
            ctx.stat.setContext(rule.match.length);
            if (ctx.trick & SubtableWriteTrick.ChainingForceFormat3) {
                results.push(this.covSubtable(rule, isChaining, ctx));
            } else {
                // Try to add into current state
                if (state.tryAddRule(rule)) continue;
                // Not working? clear state and try again
                this.flushState(isChaining, state, results, ctx);
                state = new ClassDefsAnalyzeState();
                if (state.tryAddRule(rule)) continue;
                // Still not working, give up and fallback to format 3
                results.push(this.covSubtable(rule, isChaining, ctx));
            }
        }
        this.flushState(isChaining, state, results, ctx);
        return results;
    }
}

export class GsubChainingContextualWriter extends ChainingContextualWriter<
    Gsub.Lookup,
    Gsub.Chaining
> {
    public getLookupType(lookup: Gsub.Chaining) {
        return this.useChainingLookup(lookup) ? 6 : 5;
    }
    public canBeUsed(l: Gsub.Lookup): l is Gsub.Chaining {
        return l.type === Gsub.LookupType.Chaining;
    }
}
export class GposChainingContextualWriter extends ChainingContextualWriter<
    Gpos.Lookup,
    Gpos.Chaining
> {
    public getLookupType(lookup: Gpos.Chaining) {
        return this.useChainingLookup(lookup) ? 8 : 7;
    }
    public canBeUsed(l: Gpos.Lookup): l is Gpos.Chaining {
        return l.type === Gpos.LookupType.Chaining;
    }
}
