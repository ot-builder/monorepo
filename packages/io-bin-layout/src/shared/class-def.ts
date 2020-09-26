import { NonNullablePtr16, NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag, Read, Write, WriteOpt } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { LayoutCommon } from "@ot-builder/ot-layout";
import { Data } from "@ot-builder/prelude";

import { SubtableWriteTrick } from "../gsub-gpos-shared/general";

export const MaxClsDefItemWords = 2;

export namespace ClassDefUtil {
    export function padClass0<G>(cd: LayoutCommon.ClassDef.T<G>, gs: Iterable<G>) {
        for (const g of gs) if (!cd.has(g)) cd.set(g, 0);
    }
    export function limitToCov<G>(
        cd: LayoutCommon.ClassDef.T<G>,
        cov: LayoutCommon.Coverage.T<G>
    ) {
        for (const g of cov) if (!cd.has(g)) cd.set(g, 0);
        for (const g of cd.keys()) if (!cov.has(g)) cd.delete(g);
    }
    export function SplitClassDef<G>(cd: LayoutCommon.ClassDef.T<G>) {
        const ans: G[][] = [];
        for (const [g, cl] of cd) {
            if (!ans[cl]) ans[cl] = [];
            ans[cl].push(g);
        }
        return ans;
    }
    export function getClassCount<G>(cd: LayoutCommon.ClassDef.T<G>) {
        let mc = 1;
        for (const v of cd.values()) if (v + 1 > mc) mc = v + 1;
        return mc;
    }
    export function select<G>(
        targetCls: number,
        cd: LayoutCommon.ClassDef.T<G>,
        cov?: null | LayoutCommon.Coverage.T<G>
    ) {
        const gs = new Set<G>();
        for (const [g, cls] of cd) {
            if (cls === targetCls && (!cov || cov.has(g))) {
                gs.add(g);
            }
        }
        return gs;
    }
}

export const ClassDef = {
    read(view: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const gidCD = view.next(GidClassDef);
        const mapping: LayoutCommon.ClassDef.T<OtGlyph> = new Map();
        for (const [gid, cls] of gidCD) {
            mapping.set(gOrd.at(gid), cls);
        }
        return mapping;
    },
    write(
        frag: Frag,
        cd: Iterable<[OtGlyph, number]>,
        gOrd: Data.Order<OtGlyph>,
        trick: number = 0
    ) {
        const gidMap: [number, number][] = [];
        for (const [glyph, cls] of cd) {
            if (cls) gidMap.push([gOrd.reverse(glyph), cls]);
        }
        gidMap.sort((a, b) => a[0] - b[0]);
        frag.push(GidClassDef, gidMap, trick);
    }
};
export const Ptr16ClassDef = NonNullablePtr16(ClassDef);
export const NullablePtr16ClassDef = NullablePtr16(ClassDef);

export const GidClassDef = {
    ...Read(view => {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                return view.next(OtGidClassDefFormat1);

            case 2:
                return view.next(OtGidClassDefFormat2);

            default:
                throw Errors.FormatNotSupported("classDef", format);
        }
    }),
    ...Write((frag, map: Iterable<[number, number]>, trick: number = 0) => {
        const mapping = [...map];
        const fragFormat1 = OtGidClassDefFormat1.writeOpt(mapping);
        if (!fragFormat1) {
            frag.push(OtGidClassDefFormat2, mapping);
            return;
        }
        if (trick & SubtableWriteTrick.UseFastCoverage) {
            const collector = new ClassRunCollector();
            for (const [gid, cls] of mapping) collector.update(gid, cls);
            collector.end();

            if (collector.runs.length < mapping.length) {
                frag.push(OtGidClassDefFormat2FromCollector, collector);
            } else {
                frag.embed(fragFormat1);
            }
        } else {
            const fragFormat2 = Frag.from(OtGidClassDefFormat2, mapping);
            if (fragFormat2.size < fragFormat1.size) {
                frag.embed(fragFormat2);
            } else {
                frag.embed(fragFormat2);
            }
        }
    })
};

const OtGidClassDefFormat1 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 1) throw Errors.Unreachable();

        const cd = new Map<number, number>();
        const startGlyphID = view.uint16();
        const glyphCount = view.uint16();
        for (let item = 0; item < glyphCount; item++) {
            const classValue = view.uint16();
            cd.set(item + startGlyphID, classValue);
        }
        return cd;
    }),
    ...WriteOpt((mapping: Iterable<[number, number]>) => {
        let minGID: number | null = null,
            maxGID: number | null = null;
        const clsMap: Map<number, number> = new Map();
        for (const [gid, cl] of mapping) {
            if (minGID == null || gid < minGID) minGID = gid;
            if (maxGID == null || gid > maxGID) maxGID = gid;
            clsMap.set(gid, cl);
        }
        if (minGID == null || maxGID == null) return null;

        const f = new Frag();
        f.uint16(1);
        f.uint16(minGID);
        f.uint16(maxGID - minGID + 1);
        for (let gid = minGID; gid <= maxGID; gid++) {
            const cl = clsMap.get(gid);
            if (cl === undefined) return null;
            f.uint16(cl);
        }

        return f;
    })
};

interface ClassRun {
    startGlyphID: number;
    endGlyphID: number;
    class: number;
}
class ClassRunCollector {
    public runs: ClassRun[] = [];
    public last: ClassRun | null = null;

    private start(gid: number, cls: number) {
        this.last = { startGlyphID: gid, endGlyphID: gid, class: cls };
    }
    private flush() {
        if (this.last) this.runs.push(this.last);
    }

    public update(gid: number, cls: number) {
        if (!this.last) this.start(gid, cls);
        else if (gid !== this.last.endGlyphID + 1 || cls !== this.last.class) {
            if (gid < this.last.endGlyphID) throw Errors.Unreachable();
            this.flush();
            this.start(gid, cls);
        } else {
            this.last.endGlyphID = gid;
        }
    }

    public end() {
        this.flush();
    }
}
const OtGidClassDefFormat2 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 2) throw Errors.Unreachable();

        const cd = new Map<number, number>();
        const classRangeCount = view.uint16();
        for (let ixRange = 0; ixRange < classRangeCount; ixRange++) {
            const startGlyphID = view.uint16();
            const endGlyphID = view.uint16();
            const cls = view.uint16();
            for (let ixGlyph = startGlyphID; ixGlyph <= endGlyphID; ixGlyph++) {
                cd.set(ixGlyph, cls);
            }
        }
        return cd;
    }),
    ...Write((frag, mapping: Iterable<[number, number]>) => {
        const collector = new ClassRunCollector();
        for (const [gid, cls] of mapping) {
            collector.update(gid, cls);
        }
        collector.end();

        frag.push(OtGidClassDefFormat2FromCollector, collector);
    })
};

const OtGidClassDefFormat2FromCollector = Write((frag, collector: ClassRunCollector) => {
    frag.uint16(2).uint16(collector.runs.length);
    for (const run of collector.runs) {
        frag.uint16(run.startGlyphID).uint16(run.endGlyphID).uint16(run.class);
    }
});
