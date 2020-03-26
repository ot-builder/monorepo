import { BinaryView } from "@ot-builder/bin-util";
import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVS } from "@ot-builder/var-store";

import { CffGlyphNaming } from "../charset/glyph-data-sink";
import { CffStringSource } from "../strings/source";

export class CffReadContext {
    constructor(
        public version: number = 2,
        public readonly vwCffTable: BinaryView,
        gss: Data.Maybe<OtGlyph.CoStat.Source> = null
    ) {
        if (version <= 1) {
            this.strings = new CffStringSource();
            this.naming = new CffGlyphNaming<OtGlyph>();
        }
        this.coStat = new CffGlyphCoStatSource(gss);
    }
    public ivs: null | ReadTimeIVS = null;
    public strings: null | CffStringSource = null;
    public coStat: CffGlyphCoStatSource;
    public naming: null | CffGlyphNaming<OtGlyph> = null;
}

export class CffGlyphCoStatSource implements OtGlyph.CoStat.Source {
    constructor(private readonly outer?: Data.Maybe<OtGlyph.CoStat.Source>) {}
    public getHMetric(
        gid: number,
        extent: Data.Maybe<OtGlyph.Stat.BoundingBox>
    ): Data.Maybe<OtGlyph.Metric> {
        if (this.outer) return this.outer.getHMetric(gid, extent);
        else return null;
    }
    public getVMetric(
        gid: number,
        extent: Data.Maybe<OtGlyph.Stat.BoundingBox>
    ): Data.Maybe<OtGlyph.Metric> {
        if (this.outer) return this.outer.getVMetric(gid, extent);
        else return null;
    }
}
