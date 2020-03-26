import { Errors } from "@ot-builder/errors";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";

import { CffWriteContext } from "../context/write";

import { CffCharSetDataSource } from "./io";

export class CffGlyphNameCharSetSource implements CffCharSetDataSource {
    constructor(
        private readonly ctx: CffWriteContext,
        private readonly gOrd: Data.Order<OtGlyph>
    ) {}
    public getMappingList() {
        if (!this.ctx.strings) throw Errors.Cff.ShouldHaveStrings();
        const results: number[] = [];
        for (let gid = 0; gid < this.gOrd.length; gid++) {
            results[gid] = this.ctx.strings.push(this.gOrd.at(gid).name || `.OTBuilder!GID${gid}`);
        }
        return results;
    }
}

export class CffCidCharSetSource implements CffCharSetDataSource {
    constructor(
        private readonly ctx: CffWriteContext,
        private readonly gOrd: Data.Order<OtGlyph>,
        private readonly cidMap: Data.Maybe<Map<number, OtGlyph>>
    ) {}
    public getMappingList() {
        const results: number[] = [];
        if (!this.cidMap) {
            for (let gid = 0; gid < this.gOrd.length; gid++) {
                results.push(gid);
            }
        } else {
            const revMap: Map<OtGlyph, number> = new Map();
            for (const [cid, glyph] of this.cidMap) revMap.set(glyph, cid);
            for (let gid = 0; gid < this.gOrd.length; gid++) {
                const cid = revMap.get(this.gOrd.at(gid));
                if (cid === undefined) throw Errors.GlyphNotFound(`CID mapping`);
                results[gid] = cid;
            }
        }
        return results;
    }
}
