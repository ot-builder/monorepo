import { Data } from "@ot-builder/prelude";

import { CffFdSelectSink } from "./io";

export class CffGlyphFdSelectSink<G> implements CffFdSelectSink {
    constructor(
        private glyphs: Data.Order<G>,
        private mapping: Map<G, number>
    ) {}
    public getGlyphCount() {
        return this.glyphs.length;
    }
    public put(gid: number, fd: number) {
        this.mapping.set(this.glyphs.at(gid), fd);
    }
}
