import { OtVar } from "@ot-builder/variance";

export abstract class CumulativeTvd {
    constructor(ms: OtVar.MasterSet) {
        this.valueCreator = OtVar.Create.ValueFactory(ms);
    }
    private valueCreator: OtVar.ValueFactory;
    private pending: [OtVar.Master, number][] = [];
    public addDelta(master: OtVar.Master, delta: number) {
        if (delta) this.pending.push([master, delta]);
    }
    protected collectTo(v: OtVar.Value) {
        if (!this.pending.length) return v;
        return OtVar.Ops.add(v, this.valueCreator.create(0, this.pending));
    }
}
