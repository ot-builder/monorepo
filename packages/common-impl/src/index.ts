import * as _Access from "./access";
import * as _Arith from "./arith";
import { BitMask as _BitMask } from "./bitmask";
import * as _Iterators from "./iterators";
import { IndexAllocator as _IndexAllocator, PathMapImpl as _PathMapImpl } from "./path-map";
import * as _Tie from "./typing-helper/tie";

export namespace ImpLib {
    export import Iterators = _Iterators;
    export import Arith = _Arith;
    export import BitMask = _BitMask;
    export const PathMapImpl = _PathMapImpl;
    export const IndexAllocator = _IndexAllocator;
    export import Access = _Access.Access;
    export const State = _Access.State;

    export namespace Tuple {
        export const Tie = _Tie.Tie;
    }
}
