import { Errors } from "@ot-builder/errors";
import { Gpos } from "@ot-builder/ot-layout";

import { GposAdjustment } from "../../shared/gpos-adjust";

import { ClassMatrix } from "./class-matrix";

export class OutlierTree<G> {
    public mapping: Map<G, Map<G, Gpos.AdjustmentPair>> = new Map();
    public add(fst: G, snd: G, adj: Gpos.AdjustmentPair) {
        let mSnd = this.mapping.get(fst);
        if (!mSnd) {
            mSnd = new Map<G, Gpos.AdjustmentPair>();
            this.mapping.set(fst, mSnd);
        }
        if (!mSnd.has(snd)) mSnd.set(snd, adj);
    }
    get size() {
        return this.mapping.size;
    }
    public measure() {
        let s = 10 + this.mapping.size * 6;
        let format1: number = 0;
        let format2: number = 0;
        for (const m of this.mapping.values()) {
            for (const cellAdj of m.values()) {
                const entryFormat1 = GposAdjustment.decideFormat(cellAdj[0]);
                const entryFormat2 = GposAdjustment.decideFormat(cellAdj[1]);
                format1 |= entryFormat1;
                format2 |= entryFormat2;
            }
        }
        for (const m of this.mapping.values()) {
            for (const entryAdj of m.values()) {
                s +=
                    2 +
                    GposAdjustment.measure(entryAdj[0], format1) +
                    GposAdjustment.measure(entryAdj[1], format2);
            }
        }
        return s;
    }
    public bisect() {
        const n = Math.floor(this.mapping.size / 2);
        const dt1 = new OutlierTree<G>();
        const dt2 = new OutlierTree<G>();
        let placed = 0;
        for (const [g, m] of this.mapping) {
            if (placed < n) dt1.mapping.set(g, m);
            else dt2.mapping.set(g, m);
            placed++;
        }
        return [dt1, dt2];
    }
}

export function shareColumns<G>(cm: ClassMatrix<G>) {
    const outliers = new OutlierTree<G>();
    OutlierAnalyzerImpl.shareColumnsImpl(cm, outliers);
    cm.eliminateZeroClasses();
    if (outliers.size) throw Errors.Unreachable();
}

export function analyzeOutlier<G>(cm: ClassMatrix<G>) {
    const outliers = new OutlierTree<G>();
    OutlierAnalyzerImpl.analyzeOutlierImpl(cm, outliers);
    cm.eliminateZeroClasses();
    return outliers;
}

namespace OutlierAnalyzerImpl {
    // Outlier analyzers are really "symmetric": we find that one "row" (or "column") that is
    // slightly different with somewhere else. After that we will merge them. ClassMatrix' classes
    // are ordered by item count so a linear search would provide acceptable results

    function sinkSum<G>(cc: G[][], sink: number[]) {
        let s = 0;
        for (const c of sink) s += cc[c].length;
        return s;
    }

    namespace First {
        function getDiff<G>(cm: ClassMatrix<G>, c1p: number, c1t: number, sink: number[]) {
            for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
                if (!cm.cSecond[c2].length) continue;
                const pivot = cm.adjStore.indexMatrix[c1p][c2],
                    test = cm.adjStore.indexMatrix[c1t][c2];
                if (pivot !== test) {
                    if (test) {
                        sink.push(c2);
                    } else {
                        return true;
                    }
                }
            }
            return false;
        }
        function fetch<G>(
            outliers: OutlierTree<G>,
            cm: ClassMatrix<G>,
            c1p: number,
            c1t: number,
            sink: number[]
        ) {
            let pc = 0;
            for (const c2 of sink) {
                for (const g1 of cm.cFirst[c1t]) {
                    for (const g2 of cm.cSecond[c2]) {
                        outliers.add(g1, g2, cm.get(c1t, c2));
                        pc++;
                    }
                }
            }
            cm.mergeFirstClass(c1p, c1t);
            return pc;
        }
        export function analyze<G>(cm: ClassMatrix<G>, outliers: OutlierTree<G>, maxDiff: number) {
            let pc = 0;
            let columns = 0;
            const sink: number[] = [];
            for (const col of cm.cSecond) if (col.length) columns++;
            for (let c1p = 0; c1p < cm.cFirst.length; c1p++) {
                if (!cm.firstClassValid(c1p)) continue;
                for (let c1t = 0; c1t < cm.cFirst.length; c1t++) {
                    if (c1p === c1t || !cm.firstClassValid(c1t)) continue;
                    sink.length = 0;
                    if (getDiff(cm, c1p, c1t, sink)) continue;
                    const ss = cm.cFirst[c1t].length * sinkSum(cm.cSecond, sink);
                    if (ss <= maxDiff && ss * 2 < columns) {
                        pc += fetch(outliers, cm, c1p, c1t, sink);
                    }
                }
            }
            return pc;
        }
    }

    namespace Second {
        function getDiff<G>(cm: ClassMatrix<G>, c2p: number, c2t: number, sink: number[]) {
            for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
                if (!cm.cFirst[c1].length) continue;
                const pivot = cm.adjStore.indexMatrix[c1][c2p],
                    test = cm.adjStore.indexMatrix[c1][c2t];
                if (pivot !== test) {
                    if (test) {
                        sink.push(c1);
                    } else {
                        return true;
                    }
                }
            }
            return false;
        }
        function fetch<G>(
            outliers: OutlierTree<G>,
            cm: ClassMatrix<G>,
            c2p: number,
            c2t: number,
            sink: number[]
        ) {
            let pc = 0;
            for (const c1 of sink) {
                for (const g1 of cm.cFirst[c1]) {
                    for (const g2 of cm.cSecond[c2t]) {
                        outliers.add(g1, g2, cm.get(c1, c2t));
                        pc++;
                    }
                }
            }
            cm.mergeSecondClass(c2p, c2t);
            return pc;
        }

        export function analyze<G>(cm: ClassMatrix<G>, outliers: OutlierTree<G>, maxDiff: number) {
            let pc = 0;
            let rows = 0;
            const sink: number[] = [];
            for (const row of cm.cFirst) if (row.length) rows++;
            for (let c2p = 0; c2p < cm.cSecond.length; c2p++) {
                if (!cm.secondClassValid(c2p)) continue;
                for (let c2t = 0; c2t < cm.cSecond.length; c2t++) {
                    if (c2t === c2p || !cm.secondClassValid(c2t)) continue;
                    sink.length = 0;
                    if (getDiff(cm, c2p, c2t, sink)) continue;
                    const ss = cm.cSecond[c2t].length * sinkSum(cm.cFirst, sink);
                    if (ss <= maxDiff && ss * 2 < rows) {
                        pc += fetch(outliers, cm, c2p, c2t, sink);
                    }
                }
            }
            return pc;
        }
    }

    export function shareColumnsImpl<G>(cm: ClassMatrix<G>, outliers: OutlierTree<G>) {
        if (cm.cSecond.length >= cm.cFirst.length) {
            Second.analyze(cm, outliers, 0);
            First.analyze(cm, outliers, 0);
        } else {
            First.analyze(cm, outliers, 0);
            Second.analyze(cm, outliers, 0);
        }
    }

    export function analyzeOutlierImpl<G>(cm: ClassMatrix<G>, outliers: OutlierTree<G>) {
        let md = 1;
        while (md <= 0xffff) {
            let pc = 0;
            if (cm.cSecond.length >= cm.cFirst.length) {
                pc += Second.analyze(cm, outliers, md);
                pc += First.analyze(cm, outliers, md);
            } else {
                pc += First.analyze(cm, outliers, md);
                pc += Second.analyze(cm, outliers, md);
            }
            if (pc <= 0) md *= 4;
        }
    }
}
