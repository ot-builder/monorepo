import { Errors } from "@ot-builder/errors";
import { Data } from "@ot-builder/prelude";
import { ReadTimeIVD, ReadTimeIVS } from "@ot-builder/var-store";
import { OtVar } from "@ot-builder/variance";

export class CffStackMachine {
    public ivd: ReadTimeIVD<OtVar.Dim, OtVar.Master, OtVar.Value> | null = null;
    public stack: OtVar.Value[] = [];
    public vms = OtVar.Create.MasterSet();
    private varCreator = OtVar.Create.ValueFactory(this.vms);

    constructor(public ivs?: Data.Maybe<ReadTimeIVS>) {
        if (ivs) this.ivd = ivs.tryGetIVD(0);
    }

    public stackHeight() {
        return this.stack.length;
    }

    public args(count: number) {
        if (this.stack.length < count) {
            throw Errors.Cff.StackInsufficient(this.stack.length, count);
        }
        return this.stack.splice(this.stack.length - count, count);
    }
    public allArgs(minCount: number = 0) {
        if (this.stack.length < minCount) {
            throw Errors.Cff.StackInsufficient(this.stack.length, minCount);
        }
        let s1 = [...this.stack];
        this.stack.length = 0;
        return s1;
    }
    public accumulate(vqs: OtVar.Value[]) {
        if (vqs.length < 2) return vqs;
        let s = vqs[0];
        for (let index = 1; index < vqs.length; index++) {
            s = OtVar.Ops.add(s, vqs[index]);
            vqs[index] = s;
        }
        return vqs;
    }

    public push(x: OtVar.Value) {
        this.stack.push(x);
    }
    public pop() {
        return this.args(1)[0];
    }
    public topIndex(n: number) {
        if (n >= this.stack.length) throw Errors.Cff.StackInsufficient(this.stack.length, n);
        return this.stack[this.stack.length - n - 1];
    }
    public reverseStack(left: number, right: number) {
        if (left < 0 || left >= this.stack.length || right < 0 || right >= this.stack.length) {
            throw Errors.Cff.StackInsufficient(this.stack.length, left);
        }
        let p1 = left;
        let p2 = right;
        while (p1 < p2) {
            const temp = this.stack[p1];
            this.stack[p1] = this.stack[p2];
            this.stack[p2] = temp;
            p1++;
            p2--;
        }
    }
    public setVsIndex(outId: number) {
        if (!this.ivs) throw Errors.Cff.NotVariable();
        this.ivd = this.ivs.getIVD(outId);
    }
    public doVsIndex() {
        const [_outId] = this.args(1);
        const outId = OtVar.Ops.originOf(_outId);
        this.setVsIndex(outId);
        return outId;
    }
    public doBlend() {
        if (!this.ivs || !this.ivd) throw Errors.Cff.NotVariable();
        const [_n] = this.args(1);
        const nValues = OtVar.Ops.originOf(_n);
        const nMasters = this.ivd.masterIDs.length;
        const args = this.args(nValues * (1 + nMasters));
        let results: OtVar.Value[] = [];
        for (let ixVal = 0; ixVal < nValues; ixVal++) {
            let orig = args[ixVal],
                variance: [OtVar.Master, number][] = [];
            for (let ixMaster = 0; ixMaster < nMasters; ixMaster++) {
                variance[ixMaster] = [
                    this.ivs.getMaster(this.ivd.masterIDs[ixMaster]),
                    OtVar.Ops.originOf(args[nValues + ixVal * nMasters + ixMaster])
                ];
            }
            results.push(OtVar.Ops.add(orig, this.varCreator.create(0, variance)));
        }
        for (const x of results) {
            this.stack.push(x);
        }
    }
}
