import { ImpLib } from "@ot-builder/common-impl";
import { Data } from "@ot-builder/prelude";

export const StandardPathMapFactory: Data.PathMapFactory = {
    create<Step, Value>(iter?: Iterable<[ReadonlyArray<Step>, Value]>): Data.PathMap<Step, Value> {
        return ImpLib.PathMapImpl.create(iter);
    }
};

export import ListStoreFactory = ImpLib.Order.ListStoreFactory;
export import ListStore = ImpLib.Order.ListStore;
