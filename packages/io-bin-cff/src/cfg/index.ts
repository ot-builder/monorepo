export interface CffCfgProps {
    doLocalOptimization?: boolean;
    doGlobalOptimization?: boolean;
}
export interface CffCfg {
    cff: CffCfgProps;
}
export interface CffCfgPt {
    cff?: Partial<CffCfgProps>;
}
export const DefaultCffCfgProps: CffCfgProps = {
    doLocalOptimization: true,
    doGlobalOptimization: true
};
