export interface EncodingCfgProps {
    statOs2UnicodeRanges: boolean;
    forceCmapSubtableFormatToBePresent: boolean;
    processExtPrivateTable: boolean;
}
export interface EncodingCfg {
    encoding: EncodingCfgProps;
}
export interface EncodingCfgPt {
    encoding?: Partial<EncodingCfgProps>;
}
export const DefaultEncodingCfgProps: EncodingCfgProps = {
    statOs2UnicodeRanges: true,
    forceCmapSubtableFormatToBePresent: true,
    processExtPrivateTable: true
};
