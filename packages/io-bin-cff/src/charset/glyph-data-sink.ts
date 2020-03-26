import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { CffReadContext } from "../context/read";

import { CffCharSetSink } from "./io";

export class CffGlyphNaming<G extends OtGlyph> implements Data.Naming.Source<G> {
    private mapping = new Map<G, string>();
    public getName(g: G) {
        return this.mapping.get(g);
    }
    public setName(g: G, name: string) {
        this.mapping.set(g, name);
    }
}

export class CffGlyphNameCharsetSink<G extends OtGlyph> implements CffCharSetSink {
    constructor(
        private glyphs: Data.Order<G>,
        private naming: null | CffGlyphNaming<G>,
        private ctx: CffReadContext
    ) {}
    public getGlyphCount() {
        return this.glyphs.length;
    }
    public put(gid: number, chr: number) {
        const name = this.ctx.strings!.get(chr);
        if (this.naming) this.naming.setName(this.glyphs.at(gid), name);
    }
}

export class CffCidCharsetSink<G extends OtGlyph> implements CffCharSetSink {
    constructor(
        private glyphs: Data.Order<G>,
        private naming: null | CffGlyphNaming<G>,
        private cidMap: Map<number, OtGlyph>
    ) {}
    public getGlyphCount() {
        return this.glyphs.length;
    }
    public put(gid: number, chr: number) {
        this.cidMap.set(chr, this.glyphs.at(gid));
        if (this.naming) {
            this.naming.setName(this.glyphs.at(gid), `CID${chr}`);
        }
    }
}
