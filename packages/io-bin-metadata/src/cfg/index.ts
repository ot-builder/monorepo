export type FontMetadataCfgProps = object;
export interface FontMetadataCfg {
    fontMetadata: FontMetadataCfgProps;
}
export interface FontMetadataCfgPt {
    fontMetadata?: Partial<FontMetadataCfgProps>;
}
export const DefaultFontMetadataCfgProps: FontMetadataCfgProps = {};
