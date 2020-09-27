import { Frag, Ranged, Read, Sized, Write } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { UInt16, UInt8 } from "@ot-builder/primitive";

import { CffReadContext } from "../context/read";
import { CffWriteContext } from "../context/write";

export interface CffCharSetDataSource {
    getMappingList(): readonly number[];
}
export interface CffCharSetSink {
    getGlyphCount(): number;
    put(gid: number, fd: number): void;
}

const FdSelectFormat0 = {
    ...Read((view, sink: CffCharSetSink) => {
        const nGlyphs = sink.getGlyphCount();
        for (let gid = 1; gid < nGlyphs; gid++) {
            const fd = view.uint16();
            sink.put(gid, fd);
        }
    })
};
const CffCharSetFormat12 = {
    ...Read((view, sink: CffCharSetSink, wdRest: Read<number> & Sized) => {
        const nGlyphs = sink.getGlyphCount();
        let nGlyphsCovered = 1;
        while (nGlyphsCovered < nGlyphs) {
            const sidFirst = view.uint16();
            const sidLeft = view.next(wdRest);
            for (let sid = 0; sid <= sidLeft; sid++) {
                sink.put(nGlyphsCovered + sid, sidFirst + sid);
            }
            nGlyphsCovered += 1 + sidLeft;
        }
    }),
    ...Write(
        (
            frag: Frag,
            format: UInt8,
            values: readonly number[],
            wdRest: Write<number> & Sized & Ranged
        ) => {
            frag.uint8(format);
            let lastSid = -1;
            let rest = 0;
            const gidStart = 1;
            for (let gid = gidStart; gid < values.length; gid++) {
                if (gid === gidStart || lastSid + 1 !== values[gid] || rest >= wdRest.max) {
                    if (gid > gidStart) frag.push(wdRest, rest);
                    frag.uint16(values[gid]);
                    lastSid = values[gid];
                    rest = 0;
                } else {
                    lastSid = values[gid];
                    rest++;
                }
            }
            frag.push(wdRest, rest);
        }
    )
};

export const CffCharSet = {
    ...Read((view, ctx: CffReadContext, sink: CffCharSetSink) => {
        sink.put(0, 0);
        const format = view.uint8();
        switch (format) {
            case 0:
                return view.next(FdSelectFormat0, sink);
            case 1:
                return view.next(CffCharSetFormat12, sink, UInt8);
            case 2:
                return view.next(CffCharSetFormat12, sink, UInt16);
            default:
                throw Errors.FormatNotSupported("CFF::CharSet", format);
        }
    }),
    ...Write((frag: Frag, source: CffCharSetDataSource, ctx: CffWriteContext) => {
        const charSetValues: readonly number[] = source.getMappingList();
        Assert.NoGap("CFF CharSet string ID list", charSetValues);
        const bFormat1 = Frag.pack(Frag.from(CffCharSetFormat12, 1, charSetValues, UInt8));
        const bFormat2 = Frag.pack(Frag.from(CffCharSetFormat12, 2, charSetValues, UInt16));
        if (bFormat1.byteLength < bFormat2.byteLength) {
            frag.bytes(bFormat1);
        } else {
            frag.bytes(bFormat2);
        }
    })
};
