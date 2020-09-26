import { Frag } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Gpos, GsubGpos } from "@ot-builder/ot-layout";
import { UInt16 } from "@ot-builder/primitive";

import {
    LookupWriter,
    SubtableWriteContext,
    SubtableWriteTrick
} from "../gsub-gpos-shared/general";
import { ClassDefUtil, Ptr16ClassDef } from "../shared/class-def";
import { CovUtils, GidCoverage, Ptr16GidCoverage } from "../shared/coverage";
import { GposAdjustment } from "../shared/gpos-adjust";

import { ClassMatrix } from "./kern-analyzer/class-matrix";
import { analyzeOutlier, OutlierTree, shareColumns } from "./kern-analyzer/outliers";

export class GposPairWriter implements LookupWriter<Gpos.Lookup, Gpos.Pair> {
    public canBeUsed(l: Gpos.Lookup): l is Gpos.Pair {
        return l.type === Gpos.LookupType.Pair;
    }
    public getLookupType() {
        return 2;
    }
    public getLookupTypeSymbol() {
        return Gpos.LookupType.Pair;
    }
    private writeOutliers(
        results: Frag[],
        dt: OutlierTree<OtGlyph>,
        ctx: SubtableWriteContext<Gpos.Lookup>,
        depth: number
    ) {
        if (!dt.size) return;
        ctx.stat.setContext(2);
        const dtBytes = dt.measure();
        if (dtBytes < 0x8000) {
            if (depth < 4 && dt.size > 1) {
                const [dt1, dt2] = dt.bisect();
                const dtBytes1 = dt1.measure();
                const dtBytes2 = dt2.measure();
                if (dtBytes1 + dtBytes2 + 16 < dtBytes) {
                    this.writeOutliers(results, dt1, ctx, depth + 1);
                    this.writeOutliers(results, dt2, ctx, depth + 1);
                } else {
                    results.push(Frag.from(SubtableFormat1, dt, ctx));
                }
            } else {
                results.push(Frag.from(SubtableFormat1, dt, ctx));
            }
        } else if (dt.size > 1) {
            const [dt1, dt2] = dt.bisect();
            this.writeOutliers(results, dt1, ctx, depth + 1);
            this.writeOutliers(results, dt2, ctx, depth + 1);
        } else {
            results.push(Frag.from(SubtableFormat1, dt, ctx));
        }
    }

    private writeClasses(
        results: Frag[],
        cm: ClassMatrix<OtGlyph>,
        ctx: SubtableWriteContext<Gpos.Lookup>,
        depth: number
    ) {
        const measure = cm.measure();
        if (!measure.effFst || !measure.effSnd) return;
        if (measure.size < 0x8000) {
            // build
            if (depth < 4 && measure.effFst.count > 1) {
                const [cm1, cm2] = cm.bisect(depth < 4);
                shareColumns(cm1);
                shareColumns(cm2);
                const measure1 = cm1.measure();
                const measure2 = cm2.measure();
                if (measure1.size + measure2.size + 16 < measure.size) {
                    this.writeClasses(results, cm1, ctx, depth + 1);
                    this.writeClasses(results, cm2, ctx, depth + 1);
                } else {
                    results.push(Frag.from(SubtableFormat2, cm, ctx));
                }
            } else {
                results.push(Frag.from(SubtableFormat2, cm, ctx));
            }
        } else if (measure.effFst.count > 1) {
            // bisect
            const [cm1, cm2] = cm.bisect(depth < 4);
            shareColumns(cm1);
            this.writeClasses(results, cm1, ctx, depth + 1);
            shareColumns(cm2);
            this.writeClasses(results, cm2, ctx, depth + 1);
        } else {
            // give up
            results.push(Frag.from(SubtableFormat2, cm, ctx));
        }
    }

    public createSubtableFragments(lookup: Gpos.Pair, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const cm = ClassMatrix.analyze(lookup.adjustments, ctx);
        shareColumns(cm);
        cm.sort(ctx.gOrd);
        const outliers = analyzeOutlier(cm);
        const frags: Frag[] = [];
        this.writeOutliers(frags, outliers, ctx, 0);
        this.writeClasses(frags, cm, ctx, 0);
        return frags.filter(f => f.size > 0); // Remove empty fragments
    }
}

// Structs
const SubtableFormat1 = {
    write(frag: Frag, dt: OutlierTree<OtGlyph>, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const plans: [number, Gpos.AdjustmentPair][][] = [];
        let format1 = 0;
        let format2 = 0;
        for (const [g1, m] of dt.mapping) {
            const gid1 = ctx.gOrd.reverse(g1);
            plans[gid1] = [];
            for (const [g2, adj] of m) {
                const gid2 = ctx.gOrd.reverse(g2);
                plans[gid1].push([gid2, adj]);

                const f1 = GposAdjustment.decideFormat(adj[0]);
                const f2 = GposAdjustment.decideFormat(adj[1]);
                format1 |= f1;
                format2 |= f2;
            }
        }

        const cov: number[] = [];
        frag.uint16(1);
        const fCoverage = frag.ptr16New();
        frag.uint16(format1).uint16(format2);
        const hPairSetCount = frag.reserve(UInt16);
        for (let gidFirst = 0; gidFirst < plans.length; gidFirst++) {
            if (!plans[gidFirst] || !plans[gidFirst].length) continue;
            cov.push(gidFirst);
            const fPairSet = frag.ptr16New().uint16(plans[gidFirst].length);
            for (const [gidSecond, adj] of plans[gidFirst]) {
                fPairSet.uint16(gidSecond);
                fPairSet.push(GposAdjustment, adj[0], format1, ctx.ivs);
                fPairSet.push(GposAdjustment, adj[1], format2, ctx.ivs);
            }
        }
        fCoverage.push(GidCoverage, cov, !!(ctx.trick & SubtableWriteTrick.UseFlatCoverage));
        hPairSetCount.fill(cov.length);
    }
};

const SubtableFormat2 = {
    write(frag: Frag, cm: ClassMatrix<OtGlyph>, ctx: SubtableWriteContext<Gpos.Lookup>) {
        const fcm = FinalClassMatrix.fromClassMatrix(cm);
        if (!fcm.covGlyphSet.size) return;

        const [format1, format2] = fcm.statFormat();
        const cov = CovUtils.gidListFromGlyphSet(fcm.covGlyphSet, ctx.gOrd);
        const classCount1 = ClassDefUtil.getClassCount(fcm.cd1);
        const classCount2 = ClassDefUtil.getClassCount(fcm.cd2);
        frag.uint16(2)
            .push(Ptr16GidCoverage, cov)
            .uint16(format1)
            .uint16(format2)
            .push(Ptr16ClassDef, fcm.cd1, ctx.gOrd)
            .push(Ptr16ClassDef, fcm.cd2, ctx.gOrd)
            .uint16(classCount1)
            .uint16(classCount2);

        for (let c1 = 0; c1 < classCount1; c1++) {
            for (let c2 = 0; c2 < classCount2; c2++) {
                const adj = fcm.get(c1, c2);
                frag.push(GposAdjustment, adj[0], format1, ctx.ivs);
                frag.push(GposAdjustment, adj[1], format2, ctx.ivs);
            }
        }
    }
};

class FinalClassMatrix {
    public covGlyphSet: Set<OtGlyph> = new Set();
    public cd1: GsubGpos.ClassDef = new Map();
    public cd2: GsubGpos.ClassDef = new Map();
    private adjMat: Gpos.AdjustmentPair[][] = [];

    public get(c1: number, c2: number) {
        return c1 < 0 || c2 < 0
            ? Gpos.ZeroAdjustmentPair
            : this.adjMat[c1][c2] || Gpos.ZeroAdjustmentPair;
    }

    public statFormat() {
        let format1 = 0;
        let format2 = 0;
        for (const row of this.adjMat) {
            if (!row) continue;
            for (const col of row) {
                const adj = col || Gpos.ZeroAdjustmentPair;
                format1 |= GposAdjustment.decideFormat(adj[0]);
                format2 |= GposAdjustment.decideFormat(adj[1]);
            }
        }
        return [format1, format2];
    }

    private static getClassRelocationM(cc: OtGlyph[][]) {
        const cc1 = cc.map((gs, cl) => [cl, gs] as [number, OtGlyph[]]);
        cc1.sort((a, b) => b[1].length - a[1].length);
        const forward: number[] = [];
        let clf = 0;
        for (const [cl, gs] of cc1) {
            if (gs && gs.length) {
                forward[cl] = clf++;
            } else {
                forward[cl] = -1;
            }
        }
        return forward;
    }

    public static fromClassMatrix(cm: ClassMatrix<OtGlyph>) {
        const fcm = new FinalClassMatrix();
        const reloFirst = FinalClassMatrix.getClassRelocationM(cm.cFirst);
        const reloSecond = FinalClassMatrix.getClassRelocationM(cm.cSecond);

        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            const k1 = reloFirst[c1];
            if (k1 < 0) continue;
            fcm.adjMat[k1] = [];
        }

        for (let c1 = 0; c1 < cm.cFirst.length; c1++) {
            const k1 = reloFirst[c1];
            if (k1 < 0) continue;
            const class1 = cm.cFirst[c1];
            for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
                const k2 = reloSecond[c2];
                if (k2 < 0) continue;
                const class2 = cm.cSecond[c2];
                const adj = cm.get(c1, c2);
                fcm.adjMat[k1][k2] = adj;

                for (const g of class1) {
                    fcm.covGlyphSet.add(g);
                    if (k1 > 0) fcm.cd1.set(g, k1);
                }
                for (const g of class2) {
                    if (k2 > 0) fcm.cd2.set(g, k2);
                }
            }
        }

        for (let c2 = 0; c2 < cm.cSecond.length; c2++) {
            const class2 = cm.cSecond[c2];
            if (!class2.length) continue;
        }
        return fcm;
    }
}
