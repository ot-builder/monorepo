export interface EncodingCfgProps {
    statOs2UnicodeRanges: boolean;
}
export interface EncodingCfg {
    encoding: EncodingCfgProps;
}
export interface EncodingCfgPt {
    encoding?: Partial<EncodingCfgProps>;
}
export const DefaultEncodingCfg: EncodingCfgProps = { statOs2UnicodeRanges: true };
