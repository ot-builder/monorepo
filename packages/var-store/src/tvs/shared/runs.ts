import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Errors } from "@ot-builder/errors";
import { Int16, Int8, UInt16, UInt8 } from "@ot-builder/primitive";

export enum DeltaRunFlags {
    DELTAS_ARE_ZERO = 0x80,
    DELTAS_ARE_WORDS = 0x40,
    DELTA_RUN_COUNT_MASK = 0x3f
}
export enum DeltaRunType {
    Zero,
    Short,
    Long
}
export const DeltaRun = {
    read(view: BinaryView, deltasParsed: number, points: number[], deltas: number[]) {
        const runHead = view.uint8();
        const deltasAreZero = runHead & DeltaRunFlags.DELTAS_ARE_ZERO;
        const deltasAreWords = runHead & DeltaRunFlags.DELTAS_ARE_WORDS;
        const runLength = (runHead & DeltaRunFlags.DELTA_RUN_COUNT_MASK) + 1;
        for (let ixZRun = 0; ixZRun < runLength; ixZRun++) {
            const delta = deltasAreZero ? 0 : deltasAreWords ? view.int16() : view.int8();
            if (!deltas[points[deltasParsed]]) deltas[points[deltasParsed]] = 0;
            deltas[points[deltasParsed]] += delta;
            deltasParsed++;
        }
        return deltasParsed;
    }
};

export const PointCount = {
    read(view: BinaryView) {
        const byte0 = view.uint8();
        if (byte0 === 0) return null;
        else return byte0 & 0x80 ? ((byte0 << 8) | view.uint8()) & 0x7fff : byte0;
    },
    write(b: Frag, x: number) {
        if (x >= 1 && x <= 127) {
            b.uint8(x);
        } else {
            const highHalf = ((x >> 8) & 0xff) | 0x80;
            const lowerHalf = x && 0xff;
            b.uint8(highHalf).uint8(lowerHalf);
        }
    }
};

export enum PointNumberFlags {
    POINTS_ARE_WORDS = 0x80,
    POINT_RUN_COUNT_MASK = 0x7f
}
export enum PointNumberRunType {
    Short,
    Long
}
export const PointNumberRun = {
    read(view: BinaryView, currentPoint: number, points: number[]) {
        const runHead = view.uint8();
        const pointsAreWords = runHead & PointNumberFlags.POINTS_ARE_WORDS;
        const runLength = (runHead & PointNumberFlags.POINT_RUN_COUNT_MASK) + 1;
        for (let ixZRun = 0; ixZRun < runLength; ixZRun++) {
            const deltaID = pointsAreWords ? view.uint16() : view.uint8();
            currentPoint += deltaID;
            points.push(currentPoint);
        }
        return currentPoint;
    }
};

// Optimizing delta-run and point-number-run writer

interface DpRun {
    readonly cost: number;
    readonly link: null | DpRun;
    write(frag: Frag): void;
}
function DpMin<R extends DpRun>(...runs: (null | R)[]) {
    let r: null | R = null;
    for (const run of runs) {
        if (!run) continue;
        if (!r) r = run;
        else if (run.cost < r.cost) r = run;
    }
    return r;
}
function DpUpdateTrack<R extends DpRun>(src: (null | R)[], track: number, ...runs: (null | R)[]) {
    src[track] = DpMin(src[track], ...runs);
}
export namespace DeltaRunDp {
    class ZeroRun implements DpRun {
        public readonly cost: number;
        constructor(readonly link: null | DpRun, readonly size: number) {
            this.cost = 1 + (link ? link.cost : 0);
        }
        public write(frag: Frag) {
            const lengthPart = (this.size - 1) & DeltaRunFlags.DELTA_RUN_COUNT_MASK;
            frag.uint8(DeltaRunFlags.DELTAS_ARE_ZERO | lengthPart);
        }
        public static continue(cur: null | ZeroRun, x: number) {
            if (!cur || x) return null;
            if (cur.size >= DeltaRunFlags.DELTA_RUN_COUNT_MASK) return null;
            else return new ZeroRun(cur.link, cur.size + 1);
        }
        public static startOver(started: boolean, prev: null | DpRun, x: number) {
            if ((started && !prev) || x) return null;
            return new ZeroRun(prev, 1);
        }
    }
    class ByteRun implements DpRun {
        public readonly cost: number;
        constructor(readonly link: null | DpRun, readonly data: readonly number[]) {
            this.cost = 1 + data.length + (link ? link.cost : 0);
        }
        public write(frag: Frag) {
            const lengthPart = (this.data.length - 1) & DeltaRunFlags.DELTA_RUN_COUNT_MASK;
            frag.uint8(0 | lengthPart);
            for (const x of this.data) frag.int8(x);
        }
        public static continue(cur: null | ByteRun, x: number) {
            if (!cur || Int8.from(x) !== Int16.from(x)) return null;
            if (cur.data.length >= DeltaRunFlags.DELTA_RUN_COUNT_MASK) return null;
            return new ByteRun(cur.link, [...cur.data, x]);
        }
        public static startOver(started: boolean, prev: null | DpRun, x: number) {
            if ((started && !prev) || Int8.from(x) !== Int16.from(x)) return null;
            return new ByteRun(prev, [x]);
        }
    }
    class WordRun implements DpRun {
        public readonly cost: number;
        constructor(readonly link: null | DpRun, readonly data: readonly number[]) {
            this.cost = 1 + 2 * data.length + (link ? link.cost : 0);
        }
        public write(frag: Frag) {
            const lengthPart = (this.data.length - 1) & DeltaRunFlags.DELTA_RUN_COUNT_MASK;
            frag.uint8(DeltaRunFlags.DELTAS_ARE_WORDS | lengthPart);
            for (const x of this.data) frag.int16(x);
        }
        public static continue(cur: null | WordRun, x: number) {
            if (!cur || cur.data.length >= DeltaRunFlags.DELTA_RUN_COUNT_MASK) return null;
            return new WordRun(cur.link, [...cur.data, x]);
        }
        public static startOver(started: boolean, prev: null | DpRun, x: number) {
            if (started && !prev) return null;
            return new WordRun(prev, [x]);
        }
    }
    export class Writer {
        constructor(trackLength: number) {
            this.trackingModes = 1 << trackLength;
            this.trackingRestMask = (1 << (trackLength - 1)) - 1;
        }
        private readonly trackingModes: number;
        private readonly trackingRestMask: number;

        // We keep track three possible "last run"s and pick the one with least
        // byte cost.
        private started = false;
        private zero: Array<ZeroRun | null> = [];
        private byte: Array<ByteRun | null> = [];
        private word: Array<WordRun | null> = [];

        public update(x: number) {
            const zero = [...this.zero];
            const byte = [...this.byte];
            const word = [...this.word];

            for (let track = 0; track < this.trackingModes; track++) {
                this.zero[track] = this.byte[track] = this.word[track] = null;
            }
            for (let mode = 0; mode < this.trackingModes * 2; mode++) {
                const origin = mode >>> 1;
                const track = (mode & 1) | ((origin & this.trackingRestMask) << 1);
                if (mode & 1) {
                    DpUpdateTrack(this.zero, track, ZeroRun.continue(zero[origin], x));
                    DpUpdateTrack(this.byte, track, ByteRun.continue(byte[origin], x));
                    DpUpdateTrack(this.word, track, WordRun.continue(word[origin], x));
                } else {
                    const originMin = DpMin<DpRun>(zero[origin], byte[origin], word[origin]);
                    DpUpdateTrack(this.zero, track, ZeroRun.startOver(this.started, originMin, x));
                    DpUpdateTrack(this.byte, track, ByteRun.startOver(this.started, originMin, x));
                    DpUpdateTrack(this.word, track, WordRun.startOver(this.started, originMin, x));
                }
            }

            this.started = true;
        }

        public write(frag: Frag) {
            let runs: DpRun[] = [];
            let bestRun = DpMin<DpRun>(...this.zero, ...this.byte, ...this.word);
            if (this.started && !bestRun) throw Errors.Unreachable();
            while (bestRun) {
                runs.unshift(bestRun);
                bestRun = bestRun.link;
            }
            for (const run of runs) run.write(frag);
        }
    }
}

export namespace PointNumberRunDp {
    class ByteRun implements DpRun {
        public readonly cost: number;
        constructor(readonly link: null | DpRun, readonly data: readonly number[]) {
            this.cost = 1 + data.length + (link ? link.cost : 0);
        }
        public write(frag: Frag) {
            const lengthPart = (this.data.length - 1) & PointNumberFlags.POINT_RUN_COUNT_MASK;
            frag.uint8(0 | lengthPart);
            for (const x of this.data) frag.uint8(x);
        }
        public static continue(cur: null | ByteRun, x: number) {
            if (!cur || UInt8.from(x) !== UInt16.from(x)) return null;
            if (cur.data.length >= PointNumberFlags.POINT_RUN_COUNT_MASK) return null;
            return new ByteRun(cur.link, [...cur.data, x]);
        }
        public static startOver(started: boolean, prev: null | DpRun, x: number) {
            if ((started && !prev) || UInt8.from(x) !== UInt16.from(x)) return null;
            return new ByteRun(prev, [x]);
        }
    }
    class WordRun implements DpRun {
        public readonly cost: number;
        constructor(readonly link: null | DpRun, readonly data: readonly number[]) {
            this.cost = 1 + 2 * data.length + (link ? link.cost : 0);
        }
        public write(frag: Frag) {
            const lengthPart = (this.data.length - 1) & PointNumberFlags.POINT_RUN_COUNT_MASK;
            frag.uint8(PointNumberFlags.POINTS_ARE_WORDS | lengthPart);
            for (const x of this.data) frag.uint16(x);
        }
        public static continue(cur: null | WordRun, x: number) {
            if (!cur || cur.data.length >= PointNumberFlags.POINT_RUN_COUNT_MASK) return null;
            return new WordRun(cur.link, [...cur.data, x]);
        }
        public static startOver(started: boolean, prev: null | DpRun, x: number) {
            if (started && !prev) return null;
            return new WordRun(prev, [x]);
        }
    }

    export class Writer {
        constructor(trackLength: number) {
            this.trackingModes = 1 << trackLength;
            this.trackingRestMask = (1 << (trackLength - 1)) - 1;
        }
        private readonly trackingModes: number;
        private readonly trackingRestMask: number;

        private started = false;
        private byte: Array<ByteRun | null> = [];
        private word: Array<WordRun | null> = [];

        public update(x: number) {
            const byte = [...this.byte];
            const word = [...this.word];

            for (let track = 0; track < this.trackingModes; track++) {
                this.byte[track] = this.word[track] = null;
            }
            for (let mode = 0; mode < 2 * this.trackingModes; mode++) {
                const origin = mode >>> 1;
                const track = (mode & 1) | ((origin & this.trackingRestMask) << 1);
                if (mode & 1) {
                    DpUpdateTrack(this.byte, track, ByteRun.continue(byte[origin], x));
                    DpUpdateTrack(this.word, track, WordRun.continue(word[origin], x));
                } else {
                    const originMin = DpMin<DpRun>(byte[origin], word[origin]);
                    DpUpdateTrack(this.byte, track, ByteRun.startOver(this.started, originMin, x));
                    DpUpdateTrack(this.word, track, WordRun.startOver(this.started, originMin, x));
                }
            }

            this.started = true;
        }

        public write(frag: Frag) {
            let runs: DpRun[] = [];
            let bestRun = DpMin<DpRun>(...this.byte, ...this.word);
            if (this.started && !bestRun) throw Errors.Unreachable();
            while (bestRun) {
                runs.unshift(bestRun);
                bestRun = bestRun.link;
            }
            for (const run of runs) run.write(frag);
        }
    }
}
