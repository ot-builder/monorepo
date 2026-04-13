export interface TtfWritingExtraInfoSink {
    setComponentInfo(
        glyphID: number,
        componentID: number,
        flags: number,
        targetGID: number,
        arg1: number,
        arg2: number,
        argXScale: number,
        argScale01: number,
        argScale10: number,
        argYScale: number
    ): void;
}

export class NopTtfWritingExtraInfoSink implements TtfWritingExtraInfoSink {
    public setComponentInfo() {}
}
