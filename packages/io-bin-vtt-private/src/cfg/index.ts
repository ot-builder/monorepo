export interface VttPrivateCfgProps {
    processVttPrivateTables: boolean;
    recalculatePseudoInstructions: boolean;
}
export interface VttPrivateCfg {
    vttPrivate: VttPrivateCfgProps;
}
export interface VttPrivateCfgPt {
    vttPrivate?: Partial<VttPrivateCfgProps>;
}
export const DefaultVttPrivateCfgProps: VttPrivateCfgProps = {
    processVttPrivateTables: true,
    recalculatePseudoInstructions: true
};
