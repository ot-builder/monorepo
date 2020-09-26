import { GsubGpos } from "@ot-builder/ot-layout";

export interface LayoutCfgProps {
    gdefWriteTrick?: number;
    lookupWriteTricks?: Map<GsubGpos.LookupProp, number>;
}
export interface LayoutCfg {
    layout: LayoutCfgProps;
}
export interface LayoutCfgPt {
    layout?: Partial<LayoutCfgProps>;
}

export const DefaultLayoutProps: LayoutCfgProps = {};
