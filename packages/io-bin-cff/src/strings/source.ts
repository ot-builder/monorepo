import { CffStandardStrings } from "./data";

export class CffStringSource {
    private data: string[];
    constructor() {
        this.data = [...CffStandardStrings];
    }
    public put(sid: number, s: string) {
        this.data[sid] = s;
    }
    public putByStringIndexIndex(ix: number, s: string) {
        this.data[ix + CffStandardStrings.length] = s;
    }
    public get(sid: number) {
        return this.data[sid];
    }
}
