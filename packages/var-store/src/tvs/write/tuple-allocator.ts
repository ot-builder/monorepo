import * as ImpLib from "@ot-builder/common-impl";
import { F2D14 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export class TupleStorage {
    constructor(
        public index: number,
        public tuple: F2D14[]
    ) {}
}

export class TupleAllocator {
    private store = new ImpLib.PathMapImpl<F2D14, TupleStorage>();
    private size = 0;

    public allocate(tuple: F2D14[]) {
        const existing = this.store.get(tuple);
        if (existing) {
            return existing;
        } else {
            const ts = new TupleStorage(this.size++, tuple);
            this.store.set(tuple, ts);
            return ts;
        }
    }

    public *storage() {
        const a: F2D14[][] = [];
        for (const ts of this.store.values()) {
            a[ts.index] = ts.tuple;
        }
        yield* a;
    }
}

export interface AxesTuples {
    min?: F2D14[];
    peak: F2D14[];
    max?: F2D14[];
}

export class MasterToTupleConverter {
    constructor(
        private designSpace: OtVar.DesignSpace,
        private forceKeepMinMax: boolean
    ) {}
    private cache: WeakMap<OtVar.Master, AxesTuples> = new Map();
    private getTuplesImpl(master: OtVar.Master): AxesTuples {
        const start = [],
            peak = [],
            end = [];
        let isIntermediate = false;
        for (const dim of this.designSpace) {
            let md: OtVar.MasterDim | null = null;
            for (const masterDim of master.regions) if (masterDim.dim === dim) md = masterDim;
            if (md) {
                start.push(F2D14.from(md.min));
                peak.push(F2D14.from(md.peak));
                end.push(F2D14.from(md.max));
                isIntermediate = isIntermediate || !this.masterDimIsSimple(md);
            } else {
                start.push(0);
                peak.push(0);
                end.push(0);
            }
        }

        if (this.forceKeepMinMax || isIntermediate) {
            return { min: start, peak, max: end };
        } else {
            return { peak };
        }
    }
    private masterDimIsSimple(dim: OtVar.MasterDim) {
        if (dim.peak > 0) return dim.min === 0 && dim.max === dim.peak;
        else if (dim.peak < 0) return dim.min === dim.peak && dim.max === 0;
        else return true;
    }
    public getTuples(master: OtVar.Master) {
        const existing = this.cache.get(master);
        if (existing) return existing;
        const tuples = this.getTuplesImpl(master);
        this.cache.set(master, tuples);
        return tuples;
    }
}
