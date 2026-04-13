export interface ExtPrivateCfgProps {
    processExtPrivateTable: boolean;
}
export interface ExtPrivateCfg {
    extPrivate: ExtPrivateCfgProps;
}
export interface ExtPrivateCfgPt {
    extPrivate?: Partial<ExtPrivateCfgProps>;
}
export const DefaultExtPrivateCfgProps: ExtPrivateCfgProps = {
    processExtPrivateTable: true
};
