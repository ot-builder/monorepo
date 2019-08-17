import { OtVar, OV } from "@ot-builder/variance";

export abstract class CumulativeTvd {
    constructor(ms: OtVar.MasterSet) {
        this.valueCreator = OV.Creator(ms);
    }
    private valueCreator: OtVar.ValueCreator;
    private pending: [OtVar.Master, number][] = [];
    public addDelta(master: OtVar.Master, delta: number) {
        this.pending.push([master, delta]);
    }
    protected collectTo(v: OtVar.Value) {
        if (!this.pending.length) return v;
        return OV.add(v, this.valueCreator.create(0, this.pending));
    }
}
