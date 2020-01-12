import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { Int16, UInt16 } from "@ot-builder/primitive";

import { SubtableHandler, SubtableHandlerKey } from "./general";
import { UnicodeEncodingCollector } from "./unicode-encoding-collector";

export class UnicodeBmp implements SubtableHandler {
    private mapping = Cmap.createMapping();

    public readonly key = SubtableHandlerKey.UnicodeBmp;

    public acceptEncoding(platform: number, encoding: number, format: number) {
        return platform === 3 && encoding === 1 && format === 4;
    }

    public read(view: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const format = view.uint16();
        Assert.FormatSupported("subtable format", format, 4);
        const length = view.uint16();
        const language = view.uint16();

        const segCount = view.uint16() >> 1;
        const searchRange = view.uint16();
        const entrySelector = view.uint16();
        const rangeShift = view.uint16();

        const endCountParser = view.lift(14);
        const startCountParser = view.lift(16 + segCount * UInt16.size * 1);
        const idDeltaParser = view.lift(16 + segCount * UInt16.size * 2);
        const idRangeOffsetParser = view.lift(16 + segCount * UInt16.size * 3);

        for (let seg = 0; seg < segCount; seg += 1) {
            let glyphIndex;
            const endCount = endCountParser.uint16();
            const startCount = startCountParser.uint16();
            const idDelta = idDeltaParser.uint16();
            const idRangeOffset = idRangeOffsetParser.uint16();
            for (let c = startCount; c <= endCount; c += 1) {
                if (idRangeOffset !== 0) {
                    const addrIdRangeOffsetSeg = 16 + segCount * 6 + UInt16.size * seg;
                    const glyphIndexOffset =
                        addrIdRangeOffsetSeg + (c - startCount) * UInt16.size + idRangeOffset;
                    glyphIndex = UInt16.from(view.lift(glyphIndexOffset).uint16() + idDelta);
                } else {
                    glyphIndex = UInt16.from(c + idDelta);
                }
                if (c < UInt16.max) this.mapping.set(c, gOrd.at(glyphIndex));
            }
        }
    }

    public writeOpt(cmap: Cmap.Table, gOrd: Data.Order<OtGlyph>) {
        return new CmapFormat4Writer().getFrag(
            new UnicodeEncodingCollector(cmap.unicode, gOrd, UInt16.max).collect()
        );
    }

    public apply(cmap: Cmap.Table): void {
        for (const [c, g] of this.mapping.entries()) {
            cmap.unicode.set(c, g);
        }
    }

    public createAssignments(frag: Frag) {
        if (!frag || !frag.size) return [];
        return [{ platform: 3, encoding: 1, frag }, { platform: 0, encoding: 3, frag }];
    }
}

class Run {
    private constructor(
        public readonly link: null | Run,
        public readonly unicodeStart: number,
        public readonly unicodeEnd: number,
        public readonly gidStart: number,
        public readonly gidEnd: number,
        public readonly glyphIdArray: null | ReadonlyArray<number>,
        public readonly cost: number
    ) {}

    public static Linked(started: boolean, link: null | Run, unicode: number, gid: number) {
        if (started && !link) return null;
        if (!link) return new Run(null, unicode, unicode, gid, gid, null, UInt16.size * 4);
        else return new Run(link, unicode, unicode, gid, gid, null, link.cost + UInt16.size * 4);
    }
    public static GrowSequent(old: null | Run, unicode: number, gid: number) {
        if (!old || unicode !== old.unicodeEnd + 1 || gid !== old.gidEnd + 1) return null;
        return new Run(old.link, old.unicodeStart, unicode, old.gidStart, gid, null, old.cost);
    }
    public static GrowRagged(old: null | Run, unicode: number, gid: number) {
        if (!old || unicode !== old.unicodeEnd + 1) return null;

        let gidArray = old.glyphIdArray ? [...old.glyphIdArray] : null;
        let cost = old.cost;
        if (!gidArray) {
            gidArray = [];
            for (let gidJ = old.gidStart; gidJ <= old.gidEnd; gidJ++) {
                gidArray.push(gidJ);
            }
            cost += gidArray.length * UInt16.size;
        }
        gidArray.push(gid);
        cost += UInt16.size;
        return new Run(old.link, old.unicodeStart, unicode, old.gidStart, gid, gidArray, cost);
    }
}

const TrackLength = 2;
const Track = 1 << TrackLength;
const TrackRestMask = (1 << (TrackLength - 1)) - 1;

// Find out the optimal run segmentation for a CMAP format 4 subtable
class CmapSegDpState {
    private started = false;
    private sequent: (null | Run)[] = [];
    private ragged: (null | Run)[] = [];

    private min(...runs: (null | Run)[]) {
        let best: null | Run = null;
        for (const run of runs) {
            if (!run) continue;
            if (!best || run.cost < best.cost) best = run;
        }
        return best;
    }

    public process(unicode: number, gid: number) {
        const sequent = [...this.sequent];
        const ragged = [...this.ragged];

        for (let tr = 0; tr < Track; tr++) this.sequent[tr] = this.ragged[tr] = null;
        for (let mode = 0; mode < Track * 2; mode++) {
            const original = mode >>> 1;
            const track = ((original & TrackRestMask) << 1) | (mode & 1);
            if (mode & 1) {
                this.sequent[track] = this.min(
                    this.sequent[track],
                    Run.GrowSequent(sequent[original], unicode, gid)
                );
                this.ragged[track] = this.min(
                    this.ragged[track],
                    Run.GrowRagged(ragged[original], unicode, gid)
                );
            } else {
                const basis = this.min(sequent[original], ragged[original]);
                this.sequent[track] = this.ragged[track] = this.min(
                    this.sequent[track],
                    Run.Linked(this.started, basis, unicode, gid)
                );
            }
        }
        this.started = true;
    }
    public processForce(unicode: number, gid: number) {
        for (let tr = 0; tr < Track; tr++) {
            this.sequent[tr] = Run.Linked(this.started, this.sequent[tr], unicode, gid);
            this.ragged[tr] = Run.Linked(this.started, this.ragged[tr], unicode, gid);
        }
        this.started = true;
    }

    private getChainStart() {
        if (!this.sequent || !this.ragged) throw Errors.Unreachable();
        return this.min(...this.sequent, ...this.ragged);
    }

    public getChain() {
        const chain: Run[] = [];
        let start: Run | null = this.getChainStart();
        while (start) {
            chain.push(start);
            start = start.link;
        }
        return chain.reverse();
    }
}

class CmapFormat4Writer {
    public runs: Run[] = [];

    private iterateSegments(collected: [number, number][]) {
        const dp = new CmapSegDpState();
        for (const [unicode, gid] of collected) {
            dp.process(unicode, gid);
        }
        dp.processForce(UInt16.max, 0);
        this.runs = dp.getChain();
    }

    private collectArrays() {
        const endCode: UInt16[] = [];
        const startCode: UInt16[] = [];
        const idDelta: Int16[] = [];
        const idRangeOffset: UInt16[] = [];
        const glyphIdArray: UInt16[] = [];

        for (let rid = 0; rid < this.runs.length; rid++) {
            const run = this.runs[rid];
            endCode.push(run.unicodeEnd);
            startCode.push(run.unicodeStart);
            if (!run.glyphIdArray || !run.glyphIdArray.length) {
                idDelta.push(Int16.from(run.gidStart - run.unicodeStart));
                idRangeOffset.push(0);
            } else {
                Assert.SizeMatch(
                    `CMAP format 4 run glyph id array`,
                    run.glyphIdArray.length,
                    run.unicodeEnd - run.unicodeStart + 1
                );
                idDelta.push(0);
                idRangeOffset.push(UInt16.size * (glyphIdArray.length + (this.runs.length - rid)));
                for (const gid of run.glyphIdArray) glyphIdArray.push(gid);
            }
        }

        return { endCode, startCode, idDelta, idRangeOffset, glyphIdArray };
    }

    private computeSearchRange(sc: number) {
        let searchRange = 0;
        let entrySelector = 0;
        for (entrySelector = 0, searchRange = 1; searchRange <= sc; ++entrySelector) {
            searchRange <<= 1;
        }
        return { searchRange, entrySelector: entrySelector - 1, rangeShift: 2 * sc - searchRange };
    }

    private makeTarget() {
        const fr = new Frag();
        fr.uint16(4);
        const hLength = fr.reserve(UInt16);
        fr.uint16(0); // language -- set to 0

        fr.uint16(this.runs.length * 2);
        const sr = this.computeSearchRange(this.runs.length);
        fr.uint16(sr.searchRange);
        fr.uint16(sr.entrySelector);
        fr.uint16(sr.rangeShift);

        const { endCode, startCode, idDelta, idRangeOffset, glyphIdArray } = this.collectArrays();
        fr.array(UInt16, endCode);
        fr.uint16(0);
        fr.array(UInt16, startCode);
        fr.array(Int16, idDelta);
        fr.array(UInt16, idRangeOffset);
        fr.array(UInt16, glyphIdArray);
        hLength.fill(fr.size);

        return fr;
    }

    public getFrag(collected: [number, number][]) {
        if (!collected || !collected.length) return null;
        this.iterateSegments(collected);
        if (this.runs.length > Int16.max) return null;
        return this.makeTarget();
    }
}
