export interface TtfCfgProps {
    gvarOptimizeTolerance?: number;
    gvarForceProduceTvd?: boolean;
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
    gvarForceProduceTvd: false,
    gvarReadPermissiveGlyphCount: false
};
