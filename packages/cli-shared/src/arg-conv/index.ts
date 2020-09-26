import * as FontIo from "@ot-builder/io-bin-font";
import * as Ot from "@ot-builder/ot";

export enum OptimizationLevel {
    Speed = 0,
    None = 1,
    Size = 2
}

export interface CliArgSource {
    optimizationLevel: OptimizationLevel;
    recalcOs2XAvgCharWidth: boolean;
}

export function inferSaveCfg<GS extends Ot.GlyphStore>(state: CliArgSource, font: Ot.Font<GS>) {
    const cfg: FontIo.FontIoConfig = {};
    cfg.glyphStore = { statOs2XAvgCharWidth: state.recalcOs2XAvgCharWidth };

    switch (state.optimizationLevel) {
        case OptimizationLevel.Speed: {
            const m = new Map<Ot.GsubGpos.LookupProp, number>();
            if (font.gsub) for (const lookup of font.gsub.lookups) m.set(lookup, 6);
            if (font.gpos) for (const lookup of font.gpos.lookups) m.set(lookup, 6);
            cfg.layout = { lookupWriteTricks: m };
            break;
        }
        case OptimizationLevel.Size: {
            cfg.cff = { doLocalOptimization: true, doGlobalOptimization: true };
            break;
        }
    }

    return cfg;
}
