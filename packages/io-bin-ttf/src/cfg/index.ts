export interface TtfCfgProps {
    gvarOptimizeTolerance?: number;
    gvarRead_permissiveGlyphCount?: boolean;
}
export interface TtfCfg {
    ttf: TtfCfgProps;
}
export interface TtfCfgPt {
    ttf?: Partial<TtfCfgProps>;
}
export const DefaultTtfCfgProps: TtfCfgProps = {
    gvarOptimizeTolerance: 1 / 128,
    gvarRead_permissiveGlyphCount: false
};
