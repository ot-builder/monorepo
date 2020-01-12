import { BinaryView, Frag, FragHole, Read, Write } from "@ot-builder/bin-util";
import { Assert } from "@ot-builder/errors";
import { Cmap } from "@ot-builder/ft-encoding";
import { OtGlyph } from "@ot-builder/ft-glyphs";
import { Data } from "@ot-builder/prelude";
import { UInt24, UInt32 } from "@ot-builder/primitive";

import { SubtableHandler, SubtableHandlerKey } from "./general";
import { UvsEncodingCollector } from "./unicode-encoding-collector";

const DefaultGlyph: unique symbol = Symbol();
type DefaultGlyphT = typeof DefaultGlyph;

const DefaultVs = {
    ...Read(
        (p, mapping: Cmap.GeneralVsEncodingMapT<DefaultGlyphT | OtGlyph>, varSelector: UInt24) => {
            const numUnicodeValueRanges = p.uint32();
            for (let range = 0; range < numUnicodeValueRanges; range++) {
                const startUnicodeValue = p.next(UInt24);
                const additionalCount = p.uint8();
                for (let count = 0; count <= additionalCount; count++) {
                    mapping.set(startUnicodeValue + count, varSelector, DefaultGlyph);
                }
            }
        }
    ),
    ...Write((frag, mapping: UInt24[]) => {
        const w = new DefaultVsWriter(frag);
        for (const code of mapping) w.push(code);
        w.end();
    })
};

class DefaultVsWriter {
    public hNumUnicodeValueRanges: FragHole<number>;
    constructor(private readonly frag: Frag) {
        this.hNumUnicodeValueRanges = frag.reserve(UInt32);
    }
    private started = false;
    private lastStartUnicodeValue = 0;
    private lastEndUnicodeValue = 0;
    private numUnicodeValueRanges = 0;

    public start(code: number) {
        this.started = true;
        this.lastStartUnicodeValue = this.lastEndUnicodeValue = code;
    }
    public flush() {
        if (!this.started) return;
        this.frag.push(UInt24, this.lastStartUnicodeValue);
        this.frag.uint8(this.lastEndUnicodeValue - this.lastStartUnicodeValue);
        this.numUnicodeValueRanges++;
    }

    public push(code: number) {
        if (!this.started) {
            this.start(code);
        } else if (
            code === this.lastEndUnicodeValue + 1 &&
            code - this.lastStartUnicodeValue < 0x100
        ) {
            this.lastEndUnicodeValue = code;
        } else {
            this.flush();
            this.start(code);
        }
    }

    public end() {
        if (this.started) this.flush();
        this.hNumUnicodeValueRanges.fill(this.numUnicodeValueRanges);
    }
}

const NonDefaultVs = {
    ...Read(
        (
            p,
            mapping: Cmap.GeneralVsEncodingMapT<DefaultGlyphT | OtGlyph>,
            varSelector: UInt24,
            gOrd: Data.Order<OtGlyph>
        ) => {
            const numUVSMappings = p.uint32();
            for (let index = 0; index < numUVSMappings; index++) {
                const unicodeValue = p.next(UInt24);
                const glyphID = p.uint16();
                mapping.set(unicodeValue, varSelector, gOrd.at(glyphID));
            }
        }
    ),
    ...Write((frag, mapping: Array<[number, number]>) => {
        frag.uint32(mapping.length);
        for (const [unicode, gid] of mapping) {
            frag.push(UInt24, unicode);
            frag.uint16(gid);
        }
    })
};

export class UnicodeVS implements SubtableHandler {
    private mapping = Cmap.createVsMappingT<DefaultGlyphT | OtGlyph>();

    public readonly key = SubtableHandlerKey.UnicodeVS;

    public acceptEncoding(platform: number, encoding: number, format: number) {
        return platform === 0 && encoding === 5 && format === 14;
    }

    public read(view: BinaryView, gOrd: Data.Order<OtGlyph>) {
        const format = view.uint16();
        Assert.FormatSupported("subtable format", format, 14);

        const length = view.uint32();
        const numVarSelectorRecords = view.uint32();
        for (let recId = 0; recId < numVarSelectorRecords; recId++) {
            const varSelector = view.next(UInt24);
            const pDefaultUVS = view.ptr32Nullable();
            const pNonDefaultUVS = view.ptr32Nullable();
            if (pDefaultUVS) pDefaultUVS.next(DefaultVs, this.mapping, varSelector);
            if (pNonDefaultUVS) pNonDefaultUVS.next(NonDefaultVs, this.mapping, varSelector, gOrd);
        }
    }

    public apply(cmap: Cmap.Table): void {
        for (const [code, sel, glyph] of this.mapping.entries()) {
            if (glyph !== DefaultGlyph) {
                cmap.vs.set(code, sel, glyph);
            } else {
                const defaultG = cmap.unicode.get(code);
                if (defaultG) cmap.vs.set(code, sel, defaultG);
            }
        }
    }

    public writeOpt(cmap: Cmap.Table, gOrd: Data.Order<OtGlyph>) {
        const collected = new UvsEncodingCollector(cmap.vs, cmap.unicode, gOrd).collect();
        if (!collected || !collected.length) return;

        const fSubtable = new Frag();
        fSubtable.uint16(14);
        const hLength = fSubtable.reserve(UInt32);
        fSubtable.uint32(collected.length);
        for (const entry of collected) {
            fSubtable.push(UInt24, entry.selector);
            if (entry.defaults.length) {
                fSubtable.ptr32(Frag.from(DefaultVs, entry.defaults));
            } else {
                fSubtable.ptr32(null);
            }
            if (entry.nonDefaults.length) {
                fSubtable.ptr32(Frag.from(NonDefaultVs, entry.nonDefaults));
            } else {
                fSubtable.ptr32(null);
            }
        }

        // Consolidate before filling in the length
        Frag.consolidate(fSubtable);
        hLength.fill(fSubtable.size);

        return fSubtable;
    }

    public createAssignments(frag: Frag) {
        if (!frag || !frag.size) return [];
        return [{ platform: 0, encoding: 5, frag }];
    }
}
