import { OtGlyph } from "@ot-builder/ot-glyphs";
import { Data } from "@ot-builder/prelude";
import { WriteTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

import { CffStringSink } from "../strings/sink";

export class CffWriteContext {
    public ivs: WriteTimeIVS | null = null;
    public strings: CffStringSink | null = null;
    public stat: CffGlyphStatSink;

    constructor(
        public readonly version: number,
        public readonly upm: number,
        acceptVariation = true,
        gss: Data.Maybe<OtGlyph.Stat.Sink> = null
    ) {
        if (version > 1 && acceptVariation) this.ivs = WriteTimeIVS.create(new OtVar.MasterSet());
        if (version <= 1) this.strings = new CffStringSink();
        this.stat = new CffGlyphStatSink(gss);
    }

    public getLimits() {
        if (this.version <= 1) return Cff1Limits;
        else return Cff2Limits;
    }
}

export interface CffLimits {
    readonly maxStack: number;
    readonly maxRecursion: number;
    readonly maxSubrs: number;
    readonly retSize: number;
    readonly endCharSize: number;
}

export const Cff1Limits: CffLimits = {
    maxStack: 48,
    maxRecursion: 10,
    maxSubrs: 60000,
    retSize: 1,
    endCharSize: 1
};
export const Cff2Limits: CffLimits = {
    maxStack: 512,
    maxRecursion: 10,
    maxSubrs: 60000,
    retSize: 0,
    endCharSize: 0
};

export interface CffEncodingOptions extends CffLimits {
    readonly forceBlendToPleaseTtx?: boolean;
    readonly blendOperator: number;
    readonly vsIndexOperator: number;
}

export class CffGlyphStatSink implements OtGlyph.Stat.Sink {
    public fontBBox = new OtGlyph.Stat.BoundingBoxBuilder();
    constructor(private readonly outer?: Data.Maybe<OtGlyph.Stat.Sink>) {}
    public setMetric(
        gid: number,
        horizontal: OtGlyph.Metric,
        vertical: OtGlyph.Metric,
        extent: OtGlyph.Stat.BoundingBox
    ) {
        if (this.outer) this.outer.setMetric(gid, horizontal, vertical, extent);
    }
    public setNumGlyphs(count: number): void {
        if (this.outer) this.outer.setNumGlyphs(count);
    }
    public simpleGlyphStat(st: OtGlyph.Stat.SimpleGlyphStat) {
        this.fontBBox.addBox(st.extent);
        if (this.outer) this.outer.simpleGlyphStat(st);
    }
    public complexGlyphStat(st: OtGlyph.Stat.ComplexGlyphStat) {
        this.fontBBox.addBox(st.extent);
        if (this.outer) this.outer.complexGlyphStat(st);
    }
    public instructionsStat(size: number): void {
        if (this.outer) this.outer.instructionsStat(size);
    }
    public settle() {
        if (this.outer) this.outer.settle();
    }
}
