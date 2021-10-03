import { TtfWritingExtraInfoSink } from "@ot-builder/io-bin-ttf";

export type ComponentInfo = {
    flags: number;
    targetGID: number;
    arg1: number;
    arg2: number;
    argXScale: number;
    argScale01: number;
    argScale10: number;
    argYScale: number;
};
export interface VttExtraInfoSource {
    getCompositeGlyphInfo(gid: number): ReadonlyArray<ComponentInfo>;
}
export class VttExtraInfoSinkImpl implements VttExtraInfoSource, TtfWritingExtraInfoSink {
    private m_componentInfos: ComponentInfo[][] = [];
    public getCompositeGlyphInfo(gid: number) {
        return this.m_componentInfos[gid] || [];
    }
    public setComponentInfo(
        gid: number,
        componentID: number,
        flags: number,
        targetGID: number,
        arg1: number,
        arg2: number,
        argXScale: number,
        argScale01: number,
        argScale10: number,
        argYScale: number
    ) {
        if (!this.m_componentInfos[gid]) this.m_componentInfos[gid] = [];
        this.m_componentInfos[gid][componentID] = {
            flags,
            targetGID,
            arg1,
            arg2,
            argXScale,
            argScale01,
            argScale10,
            argYScale
        };
    }
}
