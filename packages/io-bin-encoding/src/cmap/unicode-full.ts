import { BinaryView, Frag } from "@ot-builder/bin-util";
import { Assert, Errors } from "@ot-builder/errors";
import { Cmap } from "@ot-builder/ot-encoding";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { UInt16, UInt32 } from "@ot-builder/primitive";

import { SubtableHandler, SubtableHandlerKey } from "./general";
import { UnicodeEncodingCollector } from "./unicode-encoding-collector";

export class UnicodeFull implements SubtableHandler {
    private mapping = new Cmap.EncodingMap();

    public readonly key = SubtableHandlerKey.UnicodeFull;

    public acceptEncoding(platform: number, encoding: number, format: number) {
        return platform === 3 && encoding === 10 && format === 12;
    }

    public read(view: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const format = view.uint16();
        Assert.FormatSupported("subtable format", format, 12);

        const reserved = view.uint16();
        const length = view.uint32();
        const language = view.uint32();
        const numGroups = view.uint32();
        for (const [v] of view.repeat(numGroups)) {
            const startCharCode = v.uint32();
            const endCharCode = v.uint32();
            const startGlyphID = v.uint32();
            for (let code = startCharCode; code <= endCharCode; code++) {
                this.mapping.set(code, gOrd.at(code - startCharCode + startGlyphID));
            }
        }
    }

    public apply(cmap: Cmap.Table): void {
        for (const [c, g] of this.mapping.entries()) {
            cmap.unicode.set(c, g);
        }
    }

    public writeOpt(cmap: Cmap.Table, gOrd: Data.Order<OtGlyph>) {
        return new CmapFormat12Writer().getFrag(
            new UnicodeEncodingCollector(cmap.unicode, gOrd, UInt32.max).collect()
        );
    }

    public createAssignments(frag: Frag) {
        if (!frag || !frag.size) return [];
        return [
            { platform: 3, encoding: 10, frag },
            { platform: 0, encoding: 4, frag }
        ];
    }
}

class CmapFormat12Seg {
    constructor(unicode: number, gid: number) {
        this.unicodeStart = this.unicodeEnd = unicode;
        this.gidStart = this.gidEnd = gid;
    }
    public unicodeStart: number;
    public unicodeEnd: number;
    public gidStart: number;
    public gidEnd: number;

    public tryAccept(unicode: number, gid: number) {
        if (unicode !== this.unicodeEnd + 1) return false;
        if (gid !== this.gidEnd + 1) return false;
        this.unicodeEnd = unicode;
        this.gidEnd = gid;
        return true;
    }
}

class CmapFormat12Writer {
    public runs: CmapFormat12Seg[] = [];
    public last: null | CmapFormat12Seg = null;

    private startSegment(unicode: number, gid: number) {
        this.last = new CmapFormat12Seg(unicode, gid);
    }
    private flush() {
        if (!this.last) throw Errors.Unreachable();
        this.runs.push(this.last);
    }
    private iterateSegments(collected: [number, number][]) {
        for (const [unicode, gid] of collected) {
            if (!this.last) {
                this.startSegment(unicode, gid);
            } else {
                const r = this.last.tryAccept(unicode, gid);
                if (!r) {
                    this.flush();
                    this.startSegment(unicode, gid);
                }
            }
        }
        if (this.last) this.flush();
    }

    private makeTarget() {
        const fr = new Frag();
        fr.uint16(12); // format
        fr.uint16(0); // reserved
        const hLength = fr.reserve(UInt32);
        fr.uint32(0); // language
        fr.uint32(this.runs.length);
        for (const run of this.runs) {
            fr.uint32(run.unicodeStart) // startCharCode
                .uint32(run.unicodeEnd) // endCharCode
                .uint32(run.gidStart); // startGlyphID
        }
        // Flag fragment, size is trustable
        hLength.fill(fr.size);
        return fr;
    }

    public getFrag(collected: [number, number][]) {
        if (!collected || !collected.length) return null;

        let hasNonBmp = false;
        for (const [unicode, gid] of collected) {
            if (unicode >= UInt16.max) hasNonBmp = true;
        }
        if (!hasNonBmp) return null;

        this.iterateSegments(collected);
        return this.makeTarget();
    }
}
