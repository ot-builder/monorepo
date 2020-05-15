import { VarianceDim } from "../interface/dimension";
import { VarianceInstance, VarianceInstanceTupleW } from "../interface/instance";
import { VarianceMaster } from "../interface/master";

export type OtVarMasterDim = {
    readonly dim: VarianceDim;
    readonly min: number;
    readonly peak: number;
    readonly max: number;
};

function axisRegionIsInvalid<A extends VarianceDim>(ar: OtVarMasterDim) {
    return ar.min > ar.peak || ar.peak > ar.max || (ar.min < 0 && ar.max > 0 && ar.peak !== 0);
}
function axisRegionIsNeutral<A extends VarianceDim>(ar: OtVarMasterDim) {
    return axisRegionIsInvalid(ar) || ar.peak === 0;
}
function axisRegionIsSimple<A extends VarianceDim>(ar: OtVarMasterDim) {
    return (
        axisRegionIsNeutral(ar) ||
        (ar.peak > 0 && ar.max === ar.peak && ar.min === 0) ||
        (ar.peak < 0 && ar.max === 0 && ar.min === ar.peak)
    );
}

function evaluateAxis(ar: OtVarMasterDim, instanceCoordinate: number) {
    if (axisRegionIsInvalid(ar)) return 1;
    else if (ar.peak === 0) return 1;
    else if (instanceCoordinate < ar.min || instanceCoordinate > ar.max) return 0;
    else if (instanceCoordinate === ar.peak) return 1;
    else if (instanceCoordinate < ar.peak) {
        return (instanceCoordinate - ar.min) / (ar.peak - ar.min);
    } else {
        return (ar.max - instanceCoordinate) / (ar.max - ar.peak);
    }
}

export class OtVarMaster implements VarianceMaster<VarianceDim> {
    public readonly regions: readonly OtVarMasterDim[];

    constructor(init: Iterable<null | undefined | OtVarMasterDim>) {
        const regions: OtVarMasterDim[] = [];
        for (const r of init) if (r) regions.push(r);
        this.regions = regions;
    }

    /**
     * Return the peak instance
     */
    public getPeak() {
        const inst: VarianceInstanceTupleW<VarianceDim> = new Map();
        for (const ar of this.regions) {
            inst.set(ar.dim, ar.peak);
        }
        return inst;
    }

    /**
     * Weight an instance under this master
     * If the master is invalid always return 0
     * @param instance instance to weight
     */
    public evaluate(instance: VarianceInstance<VarianceDim>) {
        if (this.isInvalid()) return 0;
        let w = 1;
        for (const ar of this.regions) {
            const iv = instance ? instance.get(ar.dim) || 0 : 0;
            w *= evaluateAxis(ar, iv);
        }
        return w;
    }

    /**
     * Whether a master is invalid.
     * OTVar says that every master must have 0 at origin (null instance)
     */
    public isInvalid() {
        for (const ar of this.regions.values()) {
            if (!axisRegionIsNeutral(ar)) return false;
        }
        return true;
    }

    public isSimple() {
        for (const ar of this.regions.values()) {
            if (!axisRegionIsSimple(ar)) return false;
        }
        return true;
    }

    public toString() {
        let s: string = "";
        for (const ar of this.regions) {
            if (axisRegionIsSimple(ar)) {
                if (ar.peak === 0) continue;
                s += s ? " | " : "";
                if (ar.peak === 1) s += `${ar.dim.tag} +`;
                else if (ar.peak === -1) s += `${ar.dim.tag} -`;
                else if (ar.peak > 0) s += `${ar.dim.tag} +${ar.peak}`;
                else if (ar.peak < 0) s += `${ar.dim.tag} -${-ar.peak}`;
            } else {
                s += s ? " | " : "";
                s += `${ar.dim.tag} [${ar.min} ${ar.peak} ${ar.max}]`;
            }
        }
        return `{${s}}`;
    }
}
