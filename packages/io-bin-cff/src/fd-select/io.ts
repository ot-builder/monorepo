import { Frag, Read, Sized, Write } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Control } from "@ot-builder/prelude";
import { UInt16, UInt32, UInt8 } from "@ot-builder/primitive";

import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";

export interface CffFdSelectSink {
    getGlyphCount(): number;
    put(gid: number, fd: number): void;
}

const FdSelectFormat0 = {
    ...Read((view, sink: CffFdSelectSink) => {
        const nGlyphs = sink.getGlyphCount();
        for (let gid = 0; gid < nGlyphs; gid++) {
            const fd = view.uint8();
            sink.put(gid, fd);
        }
    })
};

class FdSelectFormat34ReadState implements Control.RunsState<[number, number | void]> {
    constructor(private sink: CffFdSelectSink) {}
    private started = false;
    private lastStartGid = 0;
    private lastFdId = 0;

    public update(gid: number, fdId: number = this.lastFdId) {
        if (this.started) {
            for (let processGid = this.lastStartGid; processGid < gid; processGid++) {
                this.sink.put(processGid, this.lastFdId);
            }
        }
        this.started = true;
        this.lastStartGid = gid;
        this.lastFdId = fdId;
        return true;
    }
}

class FdSelectFormat34WriteState implements Control.RunsState<[number]> {
    constructor(
        private readonly frag: Frag,
        private readonly wGid: Write<number> & Sized,
        private readonly wFdId: Write<number> & Sized
    ) {}
    private gid = 0;
    private lastFdId = -1;
    private ranges: [number, number][] = [];
    public update(fdId: number) {
        if (this.gid === 0 || fdId !== this.lastFdId) {
            this.ranges.push([this.gid, fdId]);
        }
        this.gid += 1;
        this.lastFdId = fdId;
    }
    public flush() {
        this.frag.push(this.wGid, this.ranges.length);
        for (let [gid, fdId] of this.ranges) {
            this.frag.push(this.wGid, gid);
            this.frag.push(this.wFdId, fdId);
        }
        this.frag.push(this.wGid, this.gid);
    }
}

const FdSelectFormat34 = {
    ...Read((view, rGid: Read<number>, rFdId: Read<number>, sink: CffFdSelectSink) => {
        const nGlyphs = sink.getGlyphCount();
        const nRanges = view.next(rGid);
        let st = new FdSelectFormat34ReadState(sink);
        for (let ixRange = 0; ixRange < nRanges; ixRange++) {
            const gid = view.next(rGid);
            const fdId = view.next(rFdId);
            st.update(gid, fdId);
        }
        const sentinel = view.next(rGid);
        if (sentinel !== nGlyphs) throw Errors.Cff.FdSelectSentinelMismatch(sentinel, nGlyphs);
        st.update(sentinel);
    }),
    ...Write(
        (
            frag,
            fdSelectAssignments: number[],
            fdSelectFormat: number,
            wGid: Write<number> & Sized,
            wFdId: Write<number> & Sized
        ) => {
            frag.uint8(fdSelectFormat);
            const st = new FdSelectFormat34WriteState(frag, wGid, wFdId);
            for (const fdId of fdSelectAssignments) st.update(fdId);
            st.flush();
        }
    )
};

export const CffFdSelect = {
    ...Read((view, ctx: CffReadContext, sink: CffFdSelectSink) => {
        const format = view.uint8();
        switch (format) {
            case 0:
                return view.next(FdSelectFormat0, sink);
            case 3:
                return view.next(FdSelectFormat34, UInt16, UInt8, sink);
            case 4:
                if (ctx.version <= 1) throw Errors.Cff.FdSelect4NotSupported();
                return view.next(FdSelectFormat34, UInt32, UInt16, sink);
            default:
                throw Errors.FormatNotSupported("CFF::FdSelect", format);
        }
    }),
    ...Write((frag: Frag, fdSelectValues: number[], ctx: CffWriteContext) => {
        Assert.NoGap("FDSelect assignments", fdSelectValues);
        let maxVal = 0;
        for (const v of fdSelectValues) if (v > maxVal) maxVal = v;
        const needsFormat4 = maxVal > 0xff || fdSelectValues.length > 0xffff;
        if (needsFormat4) {
            if (ctx.version <= 1) throw Errors.Cff.FdSelect4NotSupported();
            return frag.push(FdSelectFormat34, fdSelectValues, 4, UInt32, UInt16);
        } else {
            return frag.push(FdSelectFormat34, fdSelectValues, 3, UInt16, UInt8);
        }
    })
};
