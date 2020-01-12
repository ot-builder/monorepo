export interface TtfCfgProps {
    gvarOptimizeTolerance?: number;
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
    gvarReadPermissiveGlyphCount: false
};
