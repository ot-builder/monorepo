export namespace Gsub {
    export const Single: unique symbol = Symbol();
    export const Multi: unique symbol = Symbol();
    export const Alternate: unique symbol = Symbol();
    export const Ligature: unique symbol = Symbol();
    export const Chaining: unique symbol = Symbol();
    export const Reverse: unique symbol = Symbol();
}

export namespace Gpos {
    export const Single: unique symbol = Symbol();
    export const Pair: unique symbol = Symbol();
    export const Cursive: unique symbol = Symbol();
    export const MarkToBase: unique symbol = Symbol();
    export const MarkToLigature: unique symbol = Symbol();
    export const MarkToMark: unique symbol = Symbol();
    export const Chaining: unique symbol = Symbol();
}
