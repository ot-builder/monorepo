import { NonNullablePtr16, NullablePtr16 } from "@ot-builder/bin-composite-types";
import { BinaryView, Frag, Read, Write } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";

// When parsing a coverage we may often run into a situation that
// something like a "map" will depend on the order of the coverage's items
// Therefore we need some auxillary data types to record them

export type CovAuxMappingT<T> = Array<[number, T]>;
export type CovSplitLists<T> = { gidList: Array<number>; values: Array<T> };

export namespace CovUtils {
    function byGID<T>(a: [number, T], b: [number, T]) {
        return a[0] - b[0];
    }
    function byNum(a: number, b: number) {
        return a - b;
    }
    export function sortAuxMap<T>(axm: CovAuxMappingT<T>) {
        return [...axm].sort(byGID);
    }
    export function sortGidList(gids: number[]) {
        return gids.sort(byNum);
    }
    export function gidListFromAuxMap<T>(axm: CovAuxMappingT<T>) {
        const ans: number[] = [];
        for (const [gid, ax] of axm) ans.push(gid);
        return ans;
    }
    export function valueListFromAuxMap<T>(axm: CovAuxMappingT<T>) {
        const ans: T[] = [];
        for (const [gid, ax] of axm) ans.push(ax);
        return ans;
    }
    export function auxMapFromMap<G, T>(mapping: Iterable<[G, T]>, gOrd: Data.Order<G>) {
        const answer: CovAuxMappingT<T> = [];
        for (const [g, t] of mapping) answer.push([gOrd.reverse(g), t]);
        answer.sort(byGID);
        return answer;
    }
    export function auxMapFromMapExcl<G, T>(
        mapping: Iterable<[G, T]>,
        gOrd: Data.Order<G>,
        exclude: ReadonlySet<G>
    ) {
        const answer: CovAuxMappingT<T> = [];
        for (const [g, t] of mapping) if (!exclude.has(g)) answer.push([gOrd.reverse(g), t]);
        answer.sort(byGID);
        return answer;
    }
    export function auxMapFromExtractor<G, T>(
        mapping: Iterable<T>,
        gOrd: Data.Order<G>,
        extract: (from: T) => G
    ) {
        const answer: CovAuxMappingT<T> = [];
        for (const t of mapping) answer.push([gOrd.reverse(extract(t)), t]);
        answer.sort(byGID);
        return answer;
    }
    export function* mapFromNumbers<G, T>(
        gids: ReadonlyArray<number>,
        values: ReadonlyArray<T>,
        gOrd: Data.Order<G>
    ): IterableIterator<[G, T]> {
        Assert.SizeMatch("cov-map length", values.length, gids.length);
        for (let item = 0; item < gids.length; item++) {
            yield [gOrd.at(gids[item]), values[item]];
        }
    }
    export function splitListFromMap<G, T>(
        mapping: Iterable<[G, T]>,
        gOrd: Data.Order<G>
    ): CovSplitLists<T> {
        const gidList: number[] = [];
        const values: T[] = [];
        const axm = auxMapFromMap(mapping, gOrd);
        for (const [gid, t] of axm) {
            gidList.push(gid);
            values.push(t);
        }
        return { gidList, values };
    }
    export function* glyphsFromGidList<G>(
        gids: Iterable<number>,
        gOrd: Data.Order<G>
    ): IterableIterator<G> {
        for (const gid of gids) yield gOrd.at(gid);
    }
    export function glyphSetFromGidList<G>(gids: Iterable<number>, gOrd: Data.Order<G>) {
        const s: Set<G> = new Set();
        for (const gid of gids) s.add(gOrd.at(gid));
        return s;
    }
    export function gidListFromGlyphSet<G>(glyphs: Iterable<G>, gOrd: Data.Order<G>) {
        const gidSet: Set<number> = new Set();
        for (const glyph of glyphs) gidSet.add(gOrd.reverse(glyph));
        return [...gidSet].sort((a, b) => a - b);
    }
}

export const GlyphCoverage = {
    read(view: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const cov = view.next(GidCoverage);
        return CovUtils.glyphSetFromGidList(cov, gOrd);
    },
    write(frag: Frag, gs: ReadonlySet<OtGlyph>, gOrd: Data.Order<OtGlyph>) {
        const gl = CovUtils.gidListFromGlyphSet(gs, gOrd);
        frag.push(GidCoverage, gl);
    }
};
export const NullablePtr16GlyphCoverage = NullablePtr16(GlyphCoverage);
export const Ptr16GlyphCoverage = NonNullablePtr16(GlyphCoverage);

export const GidCoverage = {
    ...Read(view => {
        const format = view.lift(0).uint16();
        switch (format) {
            case 1:
                return view.next(OtGidCoverageFormat1);

            case 2: {
                return view.next(OtGidCoverageFormat2);
            }
            default:
                throw Errors.FormatNotSupported("coverage", format);
        }
    }),
    ...Write((frag: Frag, gidList: ReadonlyArray<number>, forceFormat1?: boolean) => {
        if (forceFormat1) {
            frag.push(OtGidCoverageFormat1, gidList);
        } else {
            const format1 = Frag.from(OtGidCoverageFormat1, gidList);
            const format2 = Frag.from(OtGidCoverageFormat2, gidList);
            if (format2.size < format1.size) {
                frag.embed(format2);
            } else {
                frag.embed(format1);
            }
        }
    })
};
export const NullablePtr16GidCoverage = NullablePtr16(GidCoverage);
export const Ptr16GidCoverage = NonNullablePtr16(GidCoverage);

const OtGidCoverageFormat1 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 1) throw Errors.Unreachable();

        const gids: number[] = [];
        const glyphCount = view.uint16();
        for (let index = 0; index < glyphCount; index++) {
            const gid = view.uint16();
            gids[index] = gid;
        }
        return gids;
    }),
    ...Write((frag, gidList: ReadonlyArray<number>) => {
        frag.uint16(1);
        frag.uint16(gidList.length);
        let lastGID = -1;
        for (let item = 0; item < gidList.length; item++) {
            const gid = gidList[item];
            // Check the results -- should not happen
            if (gid === undefined) throw Errors.Unreachable();
            if (gid < lastGID) throw Errors.Unreachable();

            frag.uint16(gid);
            lastGID = gid;
        }
    })
};

interface CoverageRun {
    startGlyphID: number;
    endGlyphID: number;
    startCoverageIndex: number;
}
class CoverageRunCollector {
    public runs: CoverageRun[] = [];
    public last: CoverageRun | null = null;

    private start(gid: number, item: number) {
        this.last = { startGlyphID: gid, endGlyphID: gid, startCoverageIndex: item };
    }
    private flush() {
        if (this.last) this.runs.push(this.last);
    }

    public update(gid: number, item: number) {
        if (!this.last) this.start(gid, item);
        else if (
            gid !== this.last.endGlyphID + 1 ||
            item !== this.last.startCoverageIndex + (gid - this.last.startGlyphID)
        ) {
            if (gid <= this.last.endGlyphID) throw Errors.Unreachable();
            this.flush();
            this.start(gid, item);
        } else {
            this.last.endGlyphID = gid;
        }
    }

    public end() {
        this.flush();
    }
}

const OtGidCoverageFormat2 = {
    ...Read(view => {
        const format = view.uint16();
        if (format !== 2) throw Errors.Unreachable();

        const gids: number[] = [];
        const classRangeCount = view.uint16();
        for (let ixRange = 0; ixRange < classRangeCount; ixRange++) {
            const startGlyphID = view.uint16();
            const endGlyphID = view.uint16();
            const startCoverageIndex = view.uint16();
            for (let ixGlyph = startGlyphID; ixGlyph <= endGlyphID; ixGlyph++) {
                gids[startCoverageIndex + ixGlyph - startGlyphID] = ixGlyph;
            }
        }
        return gids;
    }),
    ...Write((frag, gidList: ReadonlyArray<number>) => {
        const collector = new CoverageRunCollector();
        for (let item = 0; item < gidList.length; item++) {
            collector.update(gidList[item], item);
        }
        collector.end();

        frag.uint16(2).uint16(collector.runs.length);
        for (const run of collector.runs) {
            frag.uint16(run.startGlyphID).uint16(run.endGlyphID).uint16(run.startCoverageIndex);
        }
        return frag;
    })
};
