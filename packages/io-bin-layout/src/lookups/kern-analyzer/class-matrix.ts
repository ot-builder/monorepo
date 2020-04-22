import { OtGlyph } from "@ot-builder/ot-glyphs";
import { DicingStore, Gpos } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import { SubtableWriteContext } from "../../gsub-gpos-shared/general";
import { GposAdjustment } from "../../shared/gpos-adjust";

export class AdjStore {
    constructor(
        public indexMatrix: ReadonlyArray<ReadonlyArray<number>>,
        public adjustments: ReadonlyArray<Gpos.AdjustmentPair>
    ) {}
}

export class ClassMatrix<G> {
    constructor(
        public cFirst: G[][], // Per-class glyph list for first glyph. Class 0 reserved for neutral
        public cSecond: G[][], // Per-class glyph list for second glyph. Class 0 reserved for neutral
        // cSecond must cover all glyphs present in the font, so when cleaning up zero "columns" we
        // must move then to class 0 rather than simply delete them.
        public adjStore: AdjStore // Adjustments matrix
    ) {}

    public derive() {
        const copy = new ClassMatrix<G>([], [], this.adjStore);
        for (const c of this.cSecond) copy.cSecond.push([...c]);
        return copy;
    }

    public bisect(allowUneven: boolean): [ClassMatrix<G>, ClassMatrix<G>] {
        return BisectClassMatrixImpl.bisect(this, allowUneven);
    }

    public mergeFirstClass(c1p: number, c1t: number) {
        for (const e of this.cFirst[c1t]) this.cFirst[c1p].push(e);
        this.cFirst[c1t].length = 0;
    }
    public mergeSecondClass(c2p: number, c2t: number) {
        for (const e of this.cSecond[c2t]) this.cSecond[c2p].push(e);
        this.cSecond[c2t].length = 0;
    }

    public firstClassValid(c1: number) {
        return this.cFirst[c1] && this.cFirst[c1].length;
    }
    public secondClassValid(c2: number) {
        return this.cSecond[c2] && this.cSecond[c2].length;
    }

    public getEffectiveFirstClasses() {
        let eff = 0;
        for (let c1 = 0; c1 < this.cFirst.length; c1++) if (this.firstClassValid(c1)) eff++;
        return eff;
    }
    public getEffectiveSecondClasses() {
        let eff = 0;
        for (let c2 = 0; c2 < this.cSecond.length; c2++) if (this.secondClassValid(c2)) eff++;
        return eff;
    }

    public eliminateZeroClasses() {
        for (let c1 = 0; c1 < this.cFirst.length; c1++) {
            if (!this.firstClassValid(c1)) continue;
            let nonzero = false;
            for (let c2 = 1; c2 < this.cSecond.length; c2++) {
                if (!this.secondClassValid(c2)) continue;
                if (this.adjStore.indexMatrix[c1][c2]) nonzero = true;
            }
            if (!nonzero) this.cFirst[c1].length = 0;
        }
        for (let c2 = 1; c2 < this.cSecond.length; c2++) {
            if (!this.secondClassValid(c2)) continue;
            let nonzero = false;
            for (let c1 = 1; c1 < this.cFirst.length; c1++) {
                if (!this.firstClassValid(c1)) continue;
                if (this.adjStore.indexMatrix[c1][c2]) nonzero = true;
            }
            if (!nonzero) this.mergeSecondClass(0, c2);
        }
    }

    public get(c1: number, c2: number) {
        return (
            this.adjStore.adjustments[this.adjStore.indexMatrix[c1][c2]] || Gpos.ZeroAdjustmentPair
        );
    }

    public static analyze(
        ds: DicingStore<OtGlyph, OtGlyph, Gpos.AdjustmentPair>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        return AnalyzeClassMatrixImpl.main(ds, ctx);
    }

    public measure() {
        return MeasureClassMatrixImpl.measure<G>(this);
    }

    sort(ord: Data.Order<G>) {
        const [c1Relocation, c2Relocation] = this.getRelocation(ord);

        const c1a: G[][] = [];
        const c2a: G[][] = [];

        for (let c1 = 0; c1 < c1Relocation.length; c1++) {
            c1a[c1] = this.cFirst[c1Relocation[c1]];
        }
        for (let c2 = 0; c2 < c2Relocation.length; c2++) {
            c2a[c2] = this.cSecond[c2Relocation[c2]];
        }

        const indexMatrix: number[][] = [];
        for (let c1 = 0; c1 < c1Relocation.length; c1++) {
            indexMatrix[c1] = [];
            for (let c2 = 0; c2 < c2Relocation.length; c2++) {
                const srcRow = this.adjStore.indexMatrix[c1Relocation[c1]] || [];
                indexMatrix[c1][c2] = srcRow[c2Relocation[c2]] || 0;
            }
        }

        this.cFirst = c1a;
        this.cSecond = c2a;
        this.adjStore = new AdjStore(indexMatrix, this.adjStore.adjustments);
    }

    private getRelocation(ord: Data.Order<G>) {
        const c1RelocationRaw: [number, number[]][] = [];
        const c2RelocationRaw: [number, number[]][] = [];

        for (let c1 = 0; c1 < this.cFirst.length; c1++) {
            if (c1 === 0 || !this.firstClassValid(c1)) continue;
            const gids = [];
            for (const g of this.cFirst[c1]) gids.push(ord.reverse(g));
            gids.sort((a, b) => a - b);
            c1RelocationRaw.push([c1, gids]);
        }
        for (let c2 = 0; c2 < this.cSecond.length; c2++) {
            if (c2 === 0 || !this.secondClassValid(c2)) continue;
            const gids = [];
            for (const g of this.cSecond[c2]) gids.push(ord.reverse(g));
            gids.sort((a, b) => a - b);
            c2RelocationRaw.push([c2, gids]);
        }

        c1RelocationRaw.sort(compareRelocation);
        c2RelocationRaw.sort(compareRelocation);

        const c1Relocation = [0, ...c1RelocationRaw.map(x => x[0])];
        const c2Relocation = [0, ...c2RelocationRaw.map(x => x[0])];
        return [c1Relocation, c2Relocation];
    }
}

function compareRelocation(a: [number, number[]], b: [number, number[]]) {
    if (a[1].length > b[1].length) return -1;
    if (a[1].length < b[1].length) return +1;
    for (let k = 0; k < a[1].length && k < b[1].length; k++) {
        if (a[1][k] < b[1][k]) return -1;
        if (a[1][k] > b[1][k]) return +1;
    }
    return 0;
}

namespace AnalyzeClassMatrixImpl {
    class AdjAllocator {
        public adjList: Gpos.AdjustmentPair[] = [Gpos.ZeroAdjustmentPair];
        private hCache: Map<string, number> = new Map();
        private nn = 1;
        public put(adj: Data.Maybe<Gpos.AdjustmentPair>, ctx: SubtableWriteContext<Gpos.Lookup>) {
            if (!adj) return 0;

            const h = GposAdjustment.hashPair(adj, ctx.ivs);
            if (!h) return 0;

            const e = this.hCache.get(h);
            if (e) {
                return e;
            } else {
                const result = this.nn;
                this.adjList[this.nn] = adj;
                this.hCache.set(h, this.nn);
                this.nn++;
                return result;
            }
        }
    }

    type ClassOrderItem<G> = [number, G[]];

    function analyzeAdjStore<G>(
        coiFirst: ClassOrderItem<G>[],
        coiSecond: ClassOrderItem<G>[],
        ds: DicingStore<G, G, Gpos.AdjustmentPair>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const cFirst: G[][] = [];
        const cSecond: G[][] = [];
        const mat: number[][] = [];

        const alloc = new AdjAllocator();
        for (const [c1, gs1] of coiFirst) cFirst[c1 + 1] = gs1; // +1 since we have "outside" class
        for (const [c2, gs2] of coiSecond) cSecond[c2 + 1] = gs2;

        for (const [c1, gs1] of coiFirst) {
            mat[c1 + 1] = [];
            for (const [c2, gs2] of coiSecond) {
                mat[c1 + 1][c2 + 1] = alloc.put(ds.getByClass(c1, c2), ctx);
            }
        }

        return new ClassMatrix(cFirst, cSecond, new AdjStore(mat, alloc.adjList));
    }

    function padNeutrals(cc: OtGlyph[][], ctx: SubtableWriteContext<Gpos.Lookup>) {
        const sCov: Set<OtGlyph> = new Set();
        for (const gc of cc) if (gc) for (const x of gc) sCov.add(x);
        const outside: OtGlyph[] = [];
        for (const g of ctx.gOrd) if (!sCov.has(g)) outside.push(g);
        const coi: ClassOrderItem<OtGlyph>[] = [[-1, outside]]; // temporary class "-1" for outsiders
        for (let c = 0; c < cc.length; c++) {
            coi.push([c, cc[c]]);
        }
        coi.sort((a, b) => b[1].length - a[1].length);
        return coi;
    }

    export function main(
        ds: DicingStore<OtGlyph, OtGlyph, Gpos.AdjustmentPair>,
        ctx: SubtableWriteContext<Gpos.Lookup>
    ) {
        const _cFirst = ds.getXClassDef();
        const _cSecond = ds.getYClassDef();
        const coiFirst = padNeutrals(_cFirst, ctx);
        const coiSecond = padNeutrals(_cSecond, ctx);
        return analyzeAdjStore(coiFirst, coiSecond, ds, ctx);
    }
}

namespace MeasureClassMatrixImpl {
    function measureEffectCount<G>(cls: ReadonlyArray<ReadonlyArray<G>>) {
        let count = 0, // quantity of valid rows
            glyphs = 0; // quantity of glyphs in valid rows
        for (let c = 0; c < cls.length; c++) {
            if (!cls[c].length) continue;
            count++;
            glyphs += cls[c].length;
        }
        return { count, glyphs };
    }

    export function measure<G>(cm: ClassMatrix<G>) {
        const effFst = measureEffectCount(cm.cFirst);
        const effSnd = measureEffectCount(cm.cSecond);

        let format1: number = 0;
        let format2: number = 0;
        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            if (!cm.firstClassValid(c1)) continue;
            for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
                if (!cm.secondClassValid(c2)) continue;
                const entryAdj = cm.get(c1, c2);
                const entryFormat1 = GposAdjustment.decideFormat(entryAdj[0]);
                const entryFormat2 = GposAdjustment.decideFormat(entryAdj[1]);
                format1 |= entryFormat1;
                format2 |= entryFormat2;
            }
        }

        let dataSize: number = 0;
        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            if (!cm.firstClassValid(c1)) continue;
            for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
                if (!cm.secondClassValid(c2)) continue;
                const cellAdj = cm.get(c1, c2);
                dataSize +=
                    GposAdjustment.measure(cellAdj[0], format1) +
                    GposAdjustment.measure(cellAdj[1], format2);
            }
        }

        return {
            effFst,
            effSnd,
            size:
                16 +
                effFst.glyphs * 6 + // 1 coverage + 1 class def
                effSnd.glyphs * 4 + // 1 class def
                dataSize // Actual Data
        };
    }
}

namespace BisectClassMatrixImpl {
    function computeC1NonzeroCount<G>(cm: ClassMatrix<G>, c1: number) {
        let n = 0;
        for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
            if (cm.secondClassValid(c2) && cm.adjStore.indexMatrix[c1][c2]) n++;
        }
        return n;
    }

    function computeC1Difference<G>(cm: ClassMatrix<G>, c1p: number, c1t: number) {
        let diffCount = 0;
        for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
            if (!cm.secondClassValid(c2)) continue;
            if (!!cm.adjStore.indexMatrix[c1p][c2] !== !!cm.adjStore.indexMatrix[c1t][c2]) {
                diffCount++;
            }
        }
        return diffCount;
    }

    function findRowWithMinNonZero<G>(cm: ClassMatrix<G>) {
        let c1MinNonZero = -1,
            minNonZeroCount = 0xffff;
        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            if (!cm.firstClassValid(c1)) continue;
            const n = computeC1NonzeroCount(cm, c1);
            if (n < minNonZeroCount) {
                minNonZeroCount = n;
                c1MinNonZero = c1;
            }
        }
        return c1MinNonZero;
    }

    const UnevenMultiplier = 16;

    function isHighlyUneven(upperHalfClassCount: number, lowerHalfClassCount: number) {
        return (
            upperHalfClassCount * UnevenMultiplier < upperHalfClassCount + lowerHalfClassCount ||
            lowerHalfClassCount * UnevenMultiplier < upperHalfClassCount + lowerHalfClassCount
        );
    }

    export function bisect<G>(
        cm: ClassMatrix<G>,
        allowUneven: boolean
    ): [ClassMatrix<G>, ClassMatrix<G>] {
        const cm1 = cm.derive();
        const cm2 = cm.derive();

        const c1MinNonZero = findRowWithMinNonZero(cm);
        if (c1MinNonZero < 0) return bisectClassMatrixEvenly(cm);

        const c1DiffArray: number[] = [];
        let sumDiff = 0,
            nDiff = 0;

        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            if (!cm.firstClassValid(c1)) continue;
            const diff = computeC1Difference(cm, c1MinNonZero, c1);
            sumDiff += diff;
            nDiff += 1;
            c1DiffArray[c1] = diff;
        }

        // We'd like to bisect the subtable by selecting the rows that "not differ too much"
        // with the chosen row

        // Leave first class 0 empty
        cm1.cFirst[0] = [];
        cm2.cFirst[0] = [];

        // Process non-zero classes
        let upperHalfClassCount = 0,
            lowerHalfClassCount = 0;
        for (let c1 = 1; c1 < cm.cFirst.length; c1++) {
            if (cm.firstClassValid(c1)) {
                const diff = c1DiffArray[c1];
                if (nDiff * diff < sumDiff) {
                    cm1.cFirst.push([...cm.cFirst[c1]]);
                    cm2.cFirst.push([]);
                    upperHalfClassCount++;
                } else {
                    cm1.cFirst.push([]);
                    cm2.cFirst.push([...cm.cFirst[c1]]);
                    lowerHalfClassCount++;
                }
            } else {
                cm1.cFirst.push([]);
                cm2.cFirst.push([]);
            }
        }

        // Subtable is highly unevenly bisected. Fallback to the even plan
        if (!allowUneven && isHighlyUneven(upperHalfClassCount, lowerHalfClassCount)) {
            return bisectClassMatrixEvenly(cm);
        } else {
            return [cm1, cm2];
        }
    }

    function bisectClassMatrixEvenly<G>(cm: ClassMatrix<G>): [ClassMatrix<G>, ClassMatrix<G>] {
        const upperHalf = cm.derive();
        const lowerHalf = cm.derive();

        const effectiveClasses = cm.getEffectiveFirstClasses();

        // Leave first class 0 empty
        let addedClasses = 0;
        upperHalf.cFirst[0] = [];
        lowerHalf.cFirst[0] = [];
        for (let c1 = 1; c1 < cm.cFirst.length; c1++) {
            if (cm.firstClassValid(c1)) {
                if (addedClasses * 2 < effectiveClasses) {
                    upperHalf.cFirst.push([...cm.cFirst[c1]]);
                    lowerHalf.cFirst.push([]);
                } else {
                    upperHalf.cFirst.push([]);
                    lowerHalf.cFirst.push([...cm.cFirst[c1]]);
                }
                addedClasses++;
            } else {
                upperHalf.cFirst.push([]);
                lowerHalf.cFirst.push([]);
            }
        }

        return [upperHalf, lowerHalf];
    }
}
