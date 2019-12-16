import * as _Access from "./access";
import * as _Arith from "./arith";
import * as _BitMask from "./bitmask";
import * as _Iterators from "./iterators";
import * as _Order from "./order";
import * as PathMapImplLib from "./path-map";
import * as PathMapInterfaceLib from "./path-map/interface";
import * as _Tie from "./typing-helper/tie";

export namespace ImpLib {
    export import Iterators = _Iterators;
    export import Arith = _Arith;
    export import BitMask = _BitMask.BitMask;
    export import ReadonlyBitMask = _BitMask.ReadonlyBitMask;
    export import PathMapImpl = PathMapImplLib.PathMapImpl;
    export import IndexAllocator = PathMapImplLib.IndexAllocator;
    export import PathMap = PathMapInterfaceLib.PathMap;
    export import Allocator = PathMapInterfaceLib.Allocator;
    export import PathMapLens = PathMapInterfaceLib.PathMapLens;
    export import Access = _Access.Access;
    export const State = _Access.State;
    export import Order = _Order;

    export namespace Tuple {
        export const Tie = _Tie.Tie;
    }
}
