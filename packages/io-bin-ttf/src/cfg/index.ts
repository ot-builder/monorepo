export interface TtfCfgProps {
    gvarOptimizeTolerance?: number;
    gvarForceProduceGVD?: boolean;
    gvarForceZeroGapsBetweenGVD?: boolean;
    gvarReadPermissiveGlyphCount?: boolean;
}
export interface TtfCfg {
    ttf: TtfCfgProps;
}
export interface TtfCfgPt {
    ttf?: Partial<TtfCfgProps>;
}
export const DefaultTtfCfgProps: TtfCfgProps = {
    gvarOptimizeTolerance: 1 / 128,
    gvarForceProduceGVD: false,
    gvarForceZeroGapsBetweenGVD: false,
    gvarReadPermissiveGlyphCount: false
};
