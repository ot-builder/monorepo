import { ImpLib } from "@ot-builder/common-impl";
import { Data } from "@ot-builder/prelude";
import { F2D14 } from "@ot-builder/primitive";
import { OtVar } from "@ot-builder/variance";

export class TupleStorage {
    constructor(public index: number, public tuple: F2D14[]) {}
}

export class TupleAllocator {
    private store: Data.PathMap<F2D14, TupleStorage> = new ImpLib.PathMapImpl();
    private size = 0;

    public allocate(tuple: F2D14[]) {
        let existing = this.store.get(tuple);
        if (existing) {
            return existing;
        } else {
            const ts = new TupleStorage(this.size++, tuple);
            this.store.set(tuple, ts);
            return ts;
        }
    }

    public *storage() {
        let a: F2D14[][] = [];
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
    constructor(private axes: Data.Order<OtVar.Axis>, private forceKeepMinMax: boolean) {}
    private cache: Map<OtVar.Master, AxesTuples> = new Map();
    private getTuplesImpl(master: OtVar.Master): AxesTuples {
        const start = [],
            peak = [],
            end = [];
        let isIntermediate = false;
        for (const axis of this.axes) {
            let md: OtVar.MasterDim | null = null;
            for (const dim of master.regions) if (dim.axis === axis) md = dim;
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
