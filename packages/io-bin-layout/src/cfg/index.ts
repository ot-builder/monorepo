import { GsubGpos } from "@ot-builder/ot-layout";

export interface LayoutCfgProps {
    gdefWriteTrick?: number;
    lookupWriteTricks?: Map<GsubGpos.LookupProp, LookupWriteTrick>;
}
export interface LayoutCfg {
    layout: LayoutCfgProps;
}
export interface LayoutCfgPt {
    layout?: Partial<LayoutCfgProps>;
}

export const DefaultLayoutProps: LayoutCfgProps = {};

export enum LookupWriteTrick {
    None = 0,

    AvoidUseExtension = 0x0001,
    AvoidBreakSubtable = 0x0002,
    UseFlatCoverage = 0x0004,
    UseFastCoverage = 0x0008,
    AvoidUsingContextualLookup = 0x0010,

    ContextualForceFormat3 = 0x10000,
    ContextualForceFormat2 = 0x20000
}
