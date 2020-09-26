import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos, Gsub, GsubGpos } from "@ot-builder/ot-layout";
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
    cr: GsubGpos.ChainingClassRule<L>;
    firstGlyphSet: Set<OtGlyph>;
    firstGlyphClass: number;
};

class ClassDefsAnalyzeState<L> {
    public firstGlyphSet: Set<OtGlyph> = new Set();
    public cdBacktrack: GsubGpos.ClassDef = new Map();
    public cdInput: GsubGpos.ClassDef = new Map();
    public cdLookAhead: GsubGpos.ClassDef = new Map();
    public rules: Array<GsubGpos.ChainingRule<L>> = [];
    public classRules: Map<number, Array<GsubGpos.ChainingClassRule<L>>> = new Map();
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
            if (firstClass == null) firstClass = gk;
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
        let introClass = 1;
        for (const [g, cls] of cd) if (cls + 1 > introClass) introClass = cls + 1;
        for (const g of gs) cd.set(g, introClass);
        return introClass;
    }

    private glyphSetCompatibleWithClassDef(gs: Data.Maybe<Set<OtGlyph>>, cd: GsubGpos.ClassDef) {
        const kExisting = this.glyphSetCompatibleWithExistingClassDef(gs, cd);
        if (kExisting != null) return kExisting;
        else return this.glyphSetCompatibleWithNewClassDef(gs, cd);
    }

    private checkRuleCompatibility(
        rule: GsubGpos.ChainingRule<L>
    ): null | CompatibleRuleResult<L> {
        const cdBacktrack = new Map(this.cdBacktrack);
        const cdInput = new Map(this.cdInput);
        const cdLookAhead = new Map(this.cdLookAhead);

        const cr: GsubGpos.ChainingClassRule<L> = {
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

    public estimateCurrentSize() {
        return (
            UInt16.size *
            (8 +
                2 * (this.cdBacktrack.size + this.cdInput.size + this.cdLookAhead.size) +
                this.ruleComplexity)
        );
    }

    private compatibleRuleComplexity(comp: CompatibleRuleResult<L>) {
        return 8 + comp.cr.match.length + 2 * comp.cr.applications.length;
    }

    private estimateUpdatedSubtableSize(comp: CompatibleRuleResult<L>) {
        return this.estimateCurrentSize() + UInt16.size * this.compatibleRuleComplexity(comp);
    }

    private addCompatibleRule(rule: GsubGpos.ChainingRule<L>, comp: CompatibleRuleResult<L>) {
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

    public tryAddRule(rule: GsubGpos.ChainingRule<L>) {
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
        apps: ReadonlyArray<GsubGpos.ChainingApplication<L>>,
        crossRef: Data.Order<L>
    ) {
        for (const app of apps) {
            frag.uint16(app.at).uint16(crossRef.reverse(app.apply));
        }
    }
}

class CCoverageRule<L> {
    private rApplication = new CApplication<L>();
    public write(
        frag: Frag,
        isChaining: boolean,
        rule: GsubGpos.ChainingRule<L>,
        ctx: SubtableWriteContext<L>
    ) {
        frag.uint16(3);
        const backtrackSets = rule.match.slice(0, rule.inputBegins).reverse();
        const inputSets = rule.match.slice(rule.inputBegins, rule.inputEnds);
        const lookAheadSets = rule.match.slice(rule.inputEnds);
        if (isChaining) {
            frag.uint16(backtrackSets.length);
            for (const set of backtrackSets)
                frag.push(Ptr16GlyphCoverage, set, ctx.gOrd, ctx.trick);
        }

        frag.uint16(inputSets.length);
        if (!isChaining) frag.uint16(rule.applications.length);
        for (const set of inputSets) frag.push(Ptr16GlyphCoverage, set, ctx.gOrd, ctx.trick);

        if (isChaining) {
            frag.uint16(lookAheadSets.length);
            for (const set of lookAheadSets)
                frag.push(Ptr16GlyphCoverage, set, ctx.gOrd, ctx.trick);

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
        cr: GsubGpos.ChainingClassRule<L>,
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
        frag.push(Ptr16GlyphCoverage, s.firstGlyphSet, ctx.gOrd, ctx.trick);
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

abstract class ChainingContextualWriter<L, C extends L & GsubGpos.ChainingProp<L>>
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
    public abstract getLookupTypeSymbol(lookup: C): symbol;
    public abstract canBeUsed(l: L): l is C;

    private estimateCovRuleSize(rule: GsubGpos.ChainingRule<L>) {
        let s = UInt16.size * (8 + rule.match.length + 2 * rule.applications.length);
        for (let idGs = 0; idGs < rule.match.length; idGs++) {
            const gs = rule.match[idGs];
            s += UInt16.size * (2 + gs.size);
        }
        return s;
    }

    private covSubtable(
        rule: GsubGpos.ChainingRule<L>,
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

    public createSubtableFragments(lookup: C, ctx: SubtableWriteContext<L>): Array<Frag> {
        const isChaining = this.useChainingLookup(lookup);

        const covLookups: Frag[] = [];
        const covLookupSizes: number[] = [];
        for (const rule of lookup.rules) {
            covLookups.push(this.covSubtable(rule, isChaining, ctx));
            covLookupSizes.push(this.estimateCovRuleSize(rule));
        }
        if (ctx.trick & SubtableWriteTrick.ChainingForceFormat3) return covLookups;

        // Do dynamic programming to find out an optimal arrangement
        const bestResults: [number, Frag[]][] = [];
        bestResults[lookup.rules.length] = [0, []];
        for (let iRule = lookup.rules.length; iRule-- > 0; ) {
            const bestResult: [number, Frag[]] = [
                covLookupSizes[iRule] + bestResults[iRule + 1][0],
                [covLookups[iRule], ...bestResults[iRule + 1][1]]
            ];

            const state = new ClassDefsAnalyzeState<L>();
            for (let jRule = iRule; jRule < lookup.rules.length; jRule += 1) {
                if (!state.tryAddRule(lookup.rules[jRule])) break;
                const sizeUsingClassDef = state.estimateCurrentSize() + bestResults[jRule + 1][0];
                if (sizeUsingClassDef < bestResult[0]) {
                    bestResult[0] = sizeUsingClassDef;
                    bestResult[1] = [
                        this.clsSubtable(state, isChaining, ctx),
                        ...bestResults[jRule + 1][1]
                    ];
                }
            }
            bestResults[iRule] = bestResult;
        }

        return bestResults[0][1];
    }
}

export class GsubChainingContextualWriter extends ChainingContextualWriter<
    Gsub.Lookup,
    Gsub.Chaining
> {
    public getLookupType(lookup: Gsub.Chaining) {
        return this.useChainingLookup(lookup) ? 6 : 5;
    }
    public getLookupTypeSymbol() {
        return Gsub.LookupType.Chaining;
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
    public getLookupTypeSymbol() {
        return Gpos.LookupType.Chaining;
    }
    public canBeUsed(l: Gpos.Lookup): l is Gpos.Chaining {
        return l.type === Gpos.LookupType.Chaining;
    }
}
